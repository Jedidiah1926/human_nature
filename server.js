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
        Object.values(db.parties).forEach(migrateParty);
        Object.values(db.agendas).forEach(a => { a.whips ??= {}; });
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
    return { id: u.id, name: u.name, country: u.country, partyId: u.partyId, partyRoleId: u.partyRoleId || null, createdAt: u.createdAt };
}

// ===== 당내 직책 · 권한 =====
// 직책은 party.roles 배열 순서가 곧 서열(앞이 높음). 대표는 모든 직책보다 높고 모든 권한을 가짐.
const PERMS = ['edit_info', 'announce', 'approve_join', 'manage_members', 'manage_roles', 'set_whip'];
const KICK_BLOCK_MS = 24 * 3600e3;

function roleIndex(party, roleId) {
    return roleId ? party.roles.findIndex(r => r.id === roleId) : -1;
}

// 서열 숫자: 작을수록 높음. 대표 -1, 직책 0..n-1, 평당원 Infinity
function rank(party, user) {
    if (party.leaderId === user.id) return -1;
    const i = roleIndex(party, user.partyRoleId);
    return i < 0 ? Infinity : i;
}

function hasPerm(party, user, perm) {
    if (!user || user.partyId !== party.id) return false;
    if (party.leaderId === user.id) return true;
    const role = party.roles.find(r => r.id === user.partyRoleId);
    return !!role && role.perms.includes(perm);
}

function requirePerm(party, user, perm) {
    if (!hasPerm(party, user, perm)) fail(403, 'no_permission');
}

// 자기보다 낮은 서열의 당원/직책만 다룰 수 있음
function requireOutranks(party, actor, target) {
    if (rank(party, actor) >= rank(party, target)) fail(403, 'rank_too_low');
}
function requireRoleBelow(party, actor, roleIdx) {
    if (roleIdx <= rank(party, actor)) fail(403, 'rank_too_low');
}

function joinParty(user, party) {
    if (user.partyId) leaveParty(user);
    for (const p of Object.values(db.parties)) delete p.requests[user.id];
    user.partyId = party.id;
    user.partyRoleId = null;
    user.partyJoinedAt = Date.now();
}

// 정당을 떠날 때: 대표가 떠나면 서열이 가장 높은 당원(같으면 먼저 입당한 당원)이 승계, 아무도 없으면 해산
function leaveParty(user) {
    const party = db.parties[user.partyId];
    user.partyId = null;
    user.partyRoleId = null;
    user.partyJoinedAt = null;
    if (!party) return;
    const rest = partyMembers(party.id).sort((a, b) => (rank(party, a) - rank(party, b)) || (a.partyJoinedAt - b.partyJoinedAt));
    if (rest.length === 0) {
        delete db.parties[party.id];
    } else if (party.leaderId === user.id) {
        party.leaderId = rest[0].id;
        rest[0].partyRoleId = null;
    }
}

function migrateParty(p) {
    p.roles ??= [];
    p.joinPolicy ??= 'open';
    p.requests ??= {};
    p.kicked ??= {};
    p.notice ??= '';
    return p;
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
    perms: PERMS,
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
    const party = migrateParty({ id: nextId('p'), ...fields, leaderId: u.id, createdAt: Date.now() });
    db.parties[party.id] = party;
    joinParty(u, party);
    changed();
    return party;
});

function getParty(id) {
    return db.parties[id] || fail(404, 'party_not_found');
}

// 정당 정보(edit_info) · 공지(announce) · 입당 방식(approve_join)을 각각의 권한으로 수정
route('PATCH', /^\/api\/parties\/(\w+)$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    const infoKeys = ['name', 'abbr', 'color', 'ideology', 'description', 'links'];
    if (infoKeys.some(k => body[k] !== undefined)) {
        requirePerm(party, u, 'edit_info');
        Object.assign(party, readPartyFields(body, party));
    }
    if (body.notice !== undefined) {
        requirePerm(party, u, 'announce');
        party.notice = str(body.notice, 2000);
        party.noticeAt = Date.now();
        party.noticeBy = u.id;
    }
    if (body.joinPolicy !== undefined) {
        requirePerm(party, u, 'approve_join');
        if (!['open', 'approval'].includes(body.joinPolicy)) fail(400, 'invalid_policy');
        party.joinPolicy = body.joinPolicy;
    }
    changed();
    return party;
});

route('POST', /^\/api\/parties\/(\w+)\/join$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (u.partyId === party.id) return { ok: true };
    if ((party.kicked[u.id] || 0) > Date.now()) fail(403, 'kicked_recently');
    if (party.joinPolicy === 'approval') {
        party.requests[u.id] = Date.now();
        changed();
        return { pending: true };
    }
    joinParty(u, party);
    changed();
    return { ok: true };
});

route('POST', /^\/api\/parties\/(\w+)\/cancel-request$/, (req, body, [id]) => {
    const u = auth(req);
    delete getParty(id).requests[u.id];
    changed();
    return { ok: true };
});

route('POST', /^\/api\/parties\/(\w+)\/requests\/(\w+)\/(approve|reject)$/, (req, body, [id, uid, decision]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'approve_join');
    const target = db.users[uid];
    if (!target || !party.requests[uid]) fail(404, 'request_not_found');
    delete party.requests[uid];
    if (decision === 'approve') joinParty(target, party);
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

function getMember(party, uid) {
    const target = db.users[uid];
    if (!target || target.partyId !== party.id) fail(400, 'not_a_member');
    return target;
}

route('POST', /^\/api\/parties\/(\w+)\/members\/(\w+)\/kick$/, (req, body, [id, uid]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_members');
    const target = getMember(party, uid);
    requireOutranks(party, u, target);
    leaveParty(target);
    party.kicked[target.id] = Date.now() + KICK_BLOCK_MS;
    changed();
    return { ok: true };
});

// 직책 임명 · 해임 (roleId: null 이면 평당원)
route('POST', /^\/api\/parties\/(\w+)\/members\/(\w+)\/role$/, (req, body, [id, uid]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_roles');
    const target = getMember(party, uid);
    requireOutranks(party, u, target);
    if (body.roleId) {
        const idx = roleIndex(party, body.roleId);
        if (idx < 0) fail(404, 'role_not_found');
        requireRoleBelow(party, u, idx);
    }
    target.partyRoleId = body.roleId || null;
    changed();
    return { ok: true };
});

// 대표 직접 위임: 대표만 가능, 이전 대표는 평당원(또는 지정한 직책)이 됨
route('POST', /^\/api\/parties\/(\w+)\/leader$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (party.leaderId !== u.id) fail(403, 'leader_only');
    const target = getMember(party, body.userId);
    if (target.id === u.id) return { ok: true };
    const keepRole = body.keepRoleId && roleIndex(party, body.keepRoleId) >= 0 ? body.keepRoleId : null;
    party.leaderId = target.id;
    target.partyRoleId = null;
    u.partyRoleId = keepRole;
    changed();
    return { ok: true };
});

function readRole(body, party, actor, role = {}) {
    const name = body.name !== undefined ? str(body.name, 30, { required: true }) : role.name;
    const perms = body.perms !== undefined ? body.perms : role.perms;
    if (!Array.isArray(perms) || perms.some(p => !PERMS.includes(p))) fail(400, 'invalid_perms');
    // 자기가 가진 권한만 남에게 줄 수 있음
    if (perms.some(p => !hasPerm(party, actor, p))) fail(403, 'no_permission');
    if (party.roles.some(r => r.id !== role.id && r.name.toLowerCase() === name.toLowerCase())) fail(409, 'role_name_taken');
    return { name, perms: [...new Set(perms)] };
}

route('POST', /^\/api\/parties\/(\w+)\/roles$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_roles');
    if (party.roles.length >= 20) fail(400, 'too_many_roles');
    const role = { id: nextId('r'), ...readRole(body, party, u) };
    party.roles.push(role); // 새 직책은 맨 아래 서열
    changed();
    return role;
});

function getRole(party, rid) {
    const idx = roleIndex(party, rid);
    if (idx < 0) fail(404, 'role_not_found');
    return idx;
}

route('PATCH', /^\/api\/parties\/(\w+)\/roles\/(\w+)$/, (req, body, [id, rid]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_roles');
    const idx = getRole(party, rid);
    requireRoleBelow(party, u, idx);
    Object.assign(party.roles[idx], readRole(body, party, u, party.roles[idx]));
    changed();
    return party.roles[idx];
});

route('DELETE', /^\/api\/parties\/(\w+)\/roles\/(\w+)$/, (req, body, [id, rid]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_roles');
    const idx = getRole(party, rid);
    requireRoleBelow(party, u, idx);
    party.roles.splice(idx, 1);
    for (const m of partyMembers(party.id)) if (m.partyRoleId === rid) m.partyRoleId = null;
    changed();
    return { ok: true };
});

// 서열 올리기/내리기: 자기보다 낮은 직책끼리만 자리 바꿈
route('POST', /^\/api\/parties\/(\w+)\/roles\/(\w+)\/move$/, (req, body, [id, rid]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'manage_roles');
    const idx = getRole(party, rid);
    const to = idx + (body.dir === 'up' ? -1 : 1);
    if (to < 0 || to >= party.roles.length) return { ok: true };
    requireRoleBelow(party, u, Math.min(idx, to));
    [party.roles[idx], party.roles[to]] = [party.roles[to], party.roles[idx]];
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
        whips: {},      // partyId -> 당론 'yea' | 'nay' | 'abs'
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
    return { ...summarizeAgenda(a), body: a.body, votes: a.votes, whips: a.whips, snapshot: a.snapshot };
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

// 당론 지정 (set_whip). choice 'free' 면 자유 투표로 되돌림
route('POST', /^\/api\/agendas\/(\w+)\/whip$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    if (a.status !== 'open' || a.closesAt <= Date.now()) fail(400, 'agenda_closed');
    const party = db.parties[u.partyId] || fail(400, 'not_in_party');
    requirePerm(party, u, 'set_whip');
    if (body.choice === 'free') delete a.whips[party.id];
    else if (['yea', 'nay', 'abs'].includes(body.choice)) a.whips[party.id] = body.choice;
    else fail(400, 'invalid_choice');
    changed();
    return { ok: true };
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
