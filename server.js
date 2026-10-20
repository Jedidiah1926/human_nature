// Human Nature — 전 세계 누구나 의원이 되는 온라인 의회
// 의존성 없는 Node.js 서버: 정적 파일 + JSON API + 실시간 갱신(SSE). 데이터는 data/db.json에 저장.
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// 게임 규칙
const RULES = {
    agendaMinHours: 1,
    agendaMaxHours: 24 * 7,
    agendaDefaultHours: 48,
    maxOpenAgendasPerUser: 3,
    quorum: Number(process.env.QUORUM ?? 0),   // 0~1, 재적 의원 대비 최소 투표율 (기권 포함)
    sessionDays: 30,
    registerPerHour: Number(process.env.REGISTER_PER_HOUR ?? 5), // 같은 IP에서 1시간에 가입 가능한 수, 0 = 제한 없음
};

// ===== 저장소 =====
let db = {
    seq: 0,
    users: {},     // id -> { id, username, name, country, salt, hash, partyId, partyJoinedAt, createdAt }
    sessions: {},  // token -> { userId, createdAt }
    parties: {},   // id -> { id, name, abbr, color, ideology, description, links, leaderId, createdAt }
    agendas: {},   // id -> { id, title, body, authorId, createdAt, closesAt, votes, status, snapshot }
};

function loadDb() {
    try {
        db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
    } catch (e) {
        if (e.code !== 'ENOENT') throw e;
    }
}

let saveTimer = null;
function saveDb() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        fs.mkdirSync(DATA_DIR, { recursive: true });
        const tmp = DB_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(db));
        fs.renameSync(tmp, DB_FILE);
    }, 200);
}

function nextId(prefix) {
    db.seq += 1;
    return prefix + db.seq.toString(36);
}

// ===== 실시간 갱신 (Server-Sent Events) =====
const streams = new Set();
let version = 0;
function changed() {
    version += 1;
    saveDb();
    for (const res of streams) res.write(`data: ${version}\n\n`);
}

// ===== 유틸 =====
class ApiError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const fail = (status, code) => { throw new ApiError(status, code); };

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 32).toString('hex');
}

function str(v, max, { required = false, min = 0 } = {}) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (required && !s) fail(400, 'missing_field');
    if (s.length < min || s.length > max) fail(400, 'invalid_length');
    return s;
}

function countryCode(v) {
    const c = str(v, 2).toUpperCase();
    if (c && !/^[A-Z]{2}$/.test(c)) fail(400, 'invalid_country');
    return c;
}

function cleanLinks(links) {
    const out = {};
    for (const key of ['discord', 'reddit', 'dcinside', 'other']) {
        const v = typeof links?.[key] === 'string' ? links[key].trim() : '';
        if (!v) continue;
        let url;
        try { url = new URL(v); } catch { fail(400, 'invalid_link'); }
        if (url.protocol !== 'https:' && url.protocol !== 'http:') fail(400, 'invalid_link');
        if (v.length > 300) fail(400, 'invalid_link');
        out[key] = url.href;
    }
    return out;
}

function partyMembers(partyId) {
    return Object.values(db.users).filter(u => u.partyId === partyId);
}

function publicUser(u) {
    return { id: u.id, name: u.name, country: u.country, partyId: u.partyId, createdAt: u.createdAt };
}

// 정당을 떠날 때: 대표가 떠나면 가장 오래된 당원이 승계, 아무도 없으면 해산
function leaveParty(user) {
    const party = db.parties[user.partyId];
    user.partyId = null;
    user.partyJoinedAt = null;
    if (!party) return;
    const rest = partyMembers(party.id).sort((a, b) => a.partyJoinedAt - b.partyJoinedAt);
    if (rest.length === 0) delete db.parties[party.id];
    else if (party.leaderId === user.id) party.leaderId = rest[0].id;
}

function tally(agenda) {
    const t = { yea: 0, nay: 0, abs: 0 };
    for (const v of Object.values(agenda.votes)) t[v] += 1;
    return t;
}

// 마감된 의제 확정: 결과와 마감 시점의 의석 구성을 기록
function closeDueAgendas() {
    const now = Date.now();
    let any = false;
    for (const a of Object.values(db.agendas)) {
        if (a.status !== 'open' || a.closesAt > now) continue;
        const t = tally(a);
        const seats = Object.keys(db.users).length;
        const turnout = seats ? (t.yea + t.nay + t.abs) / seats : 0;
        a.status = (t.yea > t.nay && turnout >= RULES.quorum) ? 'passed' : 'rejected';
        a.snapshot = Object.fromEntries(Object.values(db.users).map(u => [u.id, u.partyId]));
        any = true;
    }
    if (any) changed();
}

function summarizeAgenda(a) {
    return {
        id: a.id, title: a.title, authorId: a.authorId, createdAt: a.createdAt,
        closesAt: a.closesAt, status: a.status, tally: tally(a),
    };
}

// ===== API =====
function auth(req, { optional = false } = {}) {
    const m = /^Bearer (\w+)$/.exec(req.headers.authorization || '');
    const session = m && db.sessions[m[1]];
    const user = session && db.users[session.userId];
    if (!user && !optional) fail(401, 'login_required');
    return user || null;
}

function createSession(user) {
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = { userId: user.id, createdAt: Date.now() };
    return token;
}

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

route('GET', /^\/api\/state$/, () => ({
    version,
    rules: RULES,
    parties: Object.values(db.parties).map(p => ({ ...p, seats: partyMembers(p.id).length })),
    members: Object.values(db.users).map(publicUser),
    agendas: Object.values(db.agendas).map(summarizeAgenda).sort((a, b) => b.createdAt - a.createdAt),
}));

route('GET', /^\/api\/me$/, (req) => {
    const u = auth(req);
    return { ...publicUser(u), username: u.username };
});

const registerLog = new Map(); // ip -> [timestamps]
route('POST', /^\/api\/register$/, (req, body) => {
    const ip = req.socket.remoteAddress;
    const recent = (registerLog.get(ip) || []).filter(t => Date.now() - t < 3600e3);
    if (RULES.registerPerHour && recent.length >= RULES.registerPerHour) fail(429, 'too_many_requests');
    const username = str(body.username, 24, { required: true, min: 3 }).toLowerCase();
    if (!/^[a-z0-9_]+$/.test(username)) fail(400, 'invalid_username');
    if (Object.values(db.users).some(u => u.username === username)) fail(409, 'username_taken');
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < 8 || password.length > 200) fail(400, 'weak_password');
    const salt = crypto.randomBytes(16).toString('hex');
    const user = {
        id: nextId('u'),
        username,
        name: str(body.name, 40) || username,
        country: countryCode(body.country),
        salt,
        hash: hashPassword(password, salt),
        partyId: null,
        partyJoinedAt: null,
        createdAt: Date.now(),
    };
    db.users[user.id] = user;
    recent.push(Date.now());
    registerLog.set(ip, recent);
    changed();
    return { token: createSession(user) };
});

route('POST', /^\/api\/login$/, (req, body) => {
    const username = str(body.username, 24).toLowerCase();
    const user = Object.values(db.users).find(u => u.username === username);
    const password = typeof body.password === 'string' ? body.password : '';
    const ok = user && crypto.timingSafeEqual(
        Buffer.from(hashPassword(password, user.salt), 'hex'), Buffer.from(user.hash, 'hex'));
    if (!ok) fail(401, 'bad_credentials');
    saveDb();
    return { token: createSession(user) };
});

route('POST', /^\/api\/logout$/, (req) => {
    const m = /^Bearer (\w+)$/.exec(req.headers.authorization || '');
    if (m) delete db.sessions[m[1]];
    saveDb();
    return { ok: true };
});

route('PATCH', /^\/api\/me$/, (req, body) => {
    const u = auth(req);
    if (body.name !== undefined) u.name = str(body.name, 40, { required: true });
    if (body.country !== undefined) u.country = countryCode(body.country);
    changed();
    return { ok: true };
});

function readPartyFields(body, party = {}) {
    const name = body.name !== undefined ? str(body.name, 40, { required: true, min: 2 }) : party.name;
    const abbr = body.abbr !== undefined ? str(body.abbr, 8) : party.abbr;
    const color = body.color !== undefined ? String(body.color) : party.color;
    if (!/^#[0-9a-fA-F]{6}$/.test(color || '')) fail(400, 'invalid_color');
    const ideology = body.ideology !== undefined ? Math.round(Number(body.ideology)) : party.ideology;
    if (!Number.isFinite(ideology) || ideology < -100 || ideology > 100) fail(400, 'invalid_ideology');
    const description = body.description !== undefined ? str(body.description, 1000) : party.description;
    const links = body.links !== undefined ? cleanLinks(body.links) : party.links;
    const lower = name.toLowerCase();
    if (Object.values(db.parties).some(p => p.id !== party.id && p.name.toLowerCase() === lower)) {
        fail(409, 'party_name_taken');
    }
    return { name, abbr, color: color.toLowerCase(), ideology, description, links };
}

route('POST', /^\/api\/parties$/, (req, body) => {
    const u = auth(req);
    const fields = readPartyFields(body);
    if (u.partyId) leaveParty(u);
    const party = { id: nextId('p'), ...fields, leaderId: u.id, createdAt: Date.now() };
    db.parties[party.id] = party;
    u.partyId = party.id;
    u.partyJoinedAt = Date.now();
    changed();
    return party;
});

function getParty(id) {
    return db.parties[id] || fail(404, 'party_not_found');
}

route('PATCH', /^\/api\/parties\/(\w+)$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (party.leaderId !== u.id) fail(403, 'leader_only');
    Object.assign(party, readPartyFields(body, party));
    changed();
    return party;
});

route('POST', /^\/api\/parties\/(\w+)\/join$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (u.partyId === party.id) return { ok: true };
    if (u.partyId) leaveParty(u);
    u.partyId = party.id;
    u.partyJoinedAt = Date.now();
    changed();
    return { ok: true };
});

route('POST', /^\/api\/parties\/leave$/, (req) => {
    const u = auth(req);
    if (!u.partyId) fail(400, 'not_in_party');
    leaveParty(u);
    changed();
    return { ok: true };
});

route('POST', /^\/api\/parties\/(\w+)\/leader$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (party.leaderId !== u.id) fail(403, 'leader_only');
    const target = db.users[body.userId];
    if (!target || target.partyId !== party.id) fail(400, 'not_a_member');
    party.leaderId = target.id;
    changed();
    return { ok: true };
});

route('POST', /^\/api\/agendas$/, (req, body) => {
    const u = auth(req);
    const open = Object.values(db.agendas).filter(a => a.authorId === u.id && a.status === 'open');
    if (open.length >= RULES.maxOpenAgendasPerUser) fail(429, 'too_many_open_agendas');
    const hours = Number(body.hours ?? RULES.agendaDefaultHours);
    if (!Number.isFinite(hours) || hours < RULES.agendaMinHours || hours > RULES.agendaMaxHours) {
        fail(400, 'invalid_duration');
    }
    const now = Date.now();
    const agenda = {
        id: nextId('a'),
        title: str(body.title, 120, { required: true, min: 4 }),
        body: str(body.body, 5000),
        authorId: u.id,
        createdAt: now,
        closesAt: now + Math.round(hours * 3600e3),
        votes: {},
        status: 'open',
        snapshot: null,
    };
    db.agendas[agenda.id] = agenda;
    changed();
    return summarizeAgenda(agenda);
});

function getAgenda(id) {
    return db.agendas[id] || fail(404, 'agenda_not_found');
}

route('GET', /^\/api\/agendas\/(\w+)$/, (req, body, [id]) => {
    const a = getAgenda(id);
    return { ...summarizeAgenda(a), body: a.body, votes: a.votes, snapshot: a.snapshot };
});

route('POST', /^\/api\/agendas\/(\w+)\/vote$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    if (a.status !== 'open' || a.closesAt <= Date.now()) fail(400, 'agenda_closed');
    if (!['yea', 'nay', 'abs'].includes(body.choice)) fail(400, 'invalid_choice');
    a.votes[u.id] = body.choice;
    changed();
    return summarizeAgenda(a);
});

route('POST', /^\/api\/agendas\/(\w+)\/withdraw$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    if (a.authorId !== u.id) fail(403, 'author_only');
    if (a.status !== 'open') fail(400, 'agenda_closed');
    a.status = 'withdrawn';
    changed();
    return summarizeAgenda(a);
});

// ===== HTTP =====
const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, pathname) {
    const file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', c => {
            size += c.length;
            if (size > 64 * 1024) { reject(new ApiError(413, 'too_large')); req.destroy(); return; }
            chunks.push(c);
        });
        req.on('end', () => {
            if (!chunks.length) return resolve({});
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
            catch { reject(new ApiError(400, 'invalid_json')); }
        });
        req.on('error', reject);
    });
}

async function handleApi(req, res, pathname) {
    const send = (status, obj) => {
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(obj));
    };
    try {
        closeDueAgendas();
        for (const r of routes) {
            const m = r.pattern.exec(pathname);
            if (!m || r.method !== req.method) continue;
            const body = req.method === 'GET' ? {} : await readBody(req);
            const out = r.handler(req, body || {}, m.slice(1));
            return send(200, out);
        }
        send(404, { error: 'not_found' });
    } catch (e) {
        if (e instanceof ApiError) return send(e.status, { error: e.code });
        console.error(e);
        send(500, { error: 'server_error' });
    }
}

function createServer() {
    return http.createServer((req, res) => {
        const { pathname } = new URL(req.url, 'http://localhost');
        if (pathname === '/api/stream') {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
            res.write(`retry: 3000\ndata: ${version}\n\n`);
            streams.add(res);
            req.on('close', () => streams.delete(res));
            return;
        }
        if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
        serveStatic(req, res, decodeURIComponent(pathname));
    });
}

function pruneSessions() {
    const cutoff = Date.now() - RULES.sessionDays * 86400e3;
    for (const [token, s] of Object.entries(db.sessions)) if (s.createdAt < cutoff) delete db.sessions[token];
}

if (require.main === module) {
    loadDb();
    pruneSessions();
    setInterval(closeDueAgendas, 15e3);
    setInterval(() => { for (const res of streams) res.write(': ping\n\n'); }, 25e3);
    createServer().listen(PORT, () => console.log(`Human Nature — http://localhost:${PORT}`));
}

module.exports = { createServer, loadDb, RULES };
