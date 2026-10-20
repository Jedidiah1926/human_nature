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
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// 게임 규칙
const RULES = {
    agendaMinHours: 1,
    agendaMaxHours: 24 * 7,
    agendaDefaultHours: 48,
    maxOpenAgendasPerUser: 3,      // 추천 단계 + 표결 중인 의제, 한 사람당
    proposalDays: 7,               // 추천 단계에서 이 기간 안에 상정 못 하면 폐기
    sponsorMin: Number(process.env.SPONSOR_MIN ?? 3),       // 상정에 필요한 최소 추천 수
    sponsorRatio: Number(process.env.SPONSOR_RATIO ?? 0.05), // 또는 재적 의원의 이 비율 (둘 중 큰 쪽)
    voteLockHours: 12,             // 표결 종료 이 시간 전부터 표 변경 · 철회 불가 (짧은 표결은 기간의 절반)
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
    agendas: {},   // id -> { id, title, body, authorId, createdAt, status, support, hours, openedAt, closesAt, votes, whips, snapshot }
    friends: {},   // 'u1|u2' (정렬) -> { from, to, status: 'pending' | 'accepted', createdAt }
};

function loadDb() {
    try {
        db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
        Object.values(db.parties).forEach(migrateParty);
        db.friends ??= {};
        Object.values(db.users).forEach(migrateUser);
        Object.values(db.agendas).forEach(a => {
            a.whips ??= {};
            a.support ??= {};
            a.openedAt ??= a.createdAt;
            a.hours ??= Math.round((a.closesAt - a.createdAt) / 3600e3);
        });
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

function migrateUser(u) {
    u.avatar ??= '';
    u.oauth ??= {};             // provider -> { id, handle, name }
    u.discord ??= null;         // { handle, verified } — verified 는 Discord 로그인으로 확인된 경우
    u.discordVisibility ??= { everyone: false, friends: false, party: false };
    return u;
}

const friendKey = (a, b) => [a, b].sort().join('|');
function areFriends(a, b) {
    return db.friends[friendKey(a, b)]?.status === 'accepted';
}

// 디스코드 ID는 본인이 고른 범위(모든 사람 / 친구 / 같은 당)에만 보임
function canSeeDiscord(viewer, target) {
    if (!target.discord) return false;
    if (viewer?.id === target.id) return true;
    const v = target.discordVisibility;
    if (v.everyone) return true;
    if (!viewer) return false;
    if (v.friends && areFriends(viewer.id, target.id)) return true;
    return !!(v.party && target.partyId && viewer.partyId === target.partyId);
}

function publicUser(u, viewer = null) {
    return {
        id: u.id, name: u.name, country: u.country, avatar: u.avatar,
        partyId: u.partyId, partyRoleId: u.partyRoleId || null, createdAt: u.createdAt,
        discord: canSeeDiscord(viewer, u) ? u.discord : null,
    };
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

// 대표는 탈당할 수 없음 — 대표를 위임하거나 정당을 해산해야 함
function leaveParty(user) {
    const party = db.parties[user.partyId];
    if (party && party.leaderId === user.id) fail(400, 'leader_cannot_leave');
    user.partyId = null;
    user.partyRoleId = null;
    user.partyJoinedAt = null;
}

function migrateParty(p) {
    p.roles ??= [];
    p.joinPolicy ??= 'open';
    p.requests ??= {};
    p.kicked ??= {};
    p.notice ??= '';
    p.leaderTitle ??= '';   // 비어 있으면 화면에서 "대표"
    p.logo ??= '';
    p.dissolvedAt ??= null;
    return p;
}

function tally(agenda) {
    const t = { yea: 0, nay: 0, abs: 0 };
    for (const v of Object.values(agenda.votes)) t[v] += 1;
    return t;
}

function supportCount(a) {
    const c = { up: 0, down: 0 };
    for (const v of Object.values(a.support)) v > 0 ? c.up++ : c.down++;
    return c;
}

// 상정에 필요한 추천 수: max(최소 추천 수, 재적 × 비율), 단 재적 의원 수를 넘지 않음
function sponsorsNeeded() {
    const n = Object.keys(db.users).length;
    return Math.max(1, Math.min(n, Math.max(RULES.sponsorMin, Math.ceil(n * RULES.sponsorRatio))));
}

function voteLockAt(a) {
    return a.closesAt - Math.min(RULES.voteLockHours * 3600e3, (a.closesAt - a.openedAt) / 2);
}

// 추천이 기준을 넘고 비추천보다 많으면 본회의 상정 → 표결 시작
function maybeOpen(a) {
    const c = supportCount(a);
    if (a.status !== 'proposed' || c.up < sponsorsNeeded() || c.up <= c.down) return;
    a.status = 'open';
    a.openedAt = Date.now();
    a.closesAt = a.openedAt + Math.round(a.hours * 3600e3);
}

// 기한 지난 의제 처리: 추천 단계는 폐기, 표결은 결과와 마감 시점의 의석 구성을 기록
function closeDueAgendas() {
    const now = Date.now();
    let any = false;
    for (const a of Object.values(db.agendas)) {
        if (a.status === 'proposed' && now > a.createdAt + RULES.proposalDays * 86400e3) {
            a.status = 'expired';
            any = true;
            continue;
        }
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

function summarizeAgenda(a, viewer = null) {
    return {
        id: a.id, title: a.title, authorId: a.authorId, createdAt: a.createdAt, status: a.status, hours: a.hours,
        support: supportCount(a), mySupport: viewer ? (a.support[viewer.id] || 0) : 0,
        expiresAt: a.createdAt + RULES.proposalDays * 86400e3,
        openedAt: a.status === 'proposed' || a.status === 'expired' ? null : a.openedAt,
        closesAt: a.closesAt, lockAt: a.closesAt ? voteLockAt(a) : null, tally: tally(a),
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

route('GET', /^\/api\/state$/, (req) => {
    const viewer = auth(req, { optional: true });
    return {
        version,
        rules: { ...RULES, sponsorsNeeded: sponsorsNeeded(), oauth: Object.keys(OAUTH).filter(k => OAUTH[k].clientId) },
        perms: PERMS,
        parties: Object.values(db.parties).map(p => ({ ...p, seats: partyMembers(p.id).length })),
        members: Object.values(db.users).map(u => publicUser(u, viewer)),
        agendas: Object.values(db.agendas).map(a => summarizeAgenda(a, viewer)).sort((a, b) => b.createdAt - a.createdAt),
    };
});

route('GET', /^\/api\/me$/, (req) => {
    const u = auth(req);
    const friends = Object.values(db.friends)
        .filter(f => f.from === u.id || f.to === u.id)
        .map(f => ({
            userId: f.from === u.id ? f.to : f.from,
            status: f.status === 'accepted' ? 'friends' : f.from === u.id ? 'outgoing' : 'incoming',
        }));
    return {
        ...publicUser(u, u), username: u.username, hasPassword: !!u.hash,
        linked: Object.keys(u.oauth), discordVisibility: u.discordVisibility, friends,
    };
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
    db.users[migrateUser(user).id] = user;
    recent.push(Date.now());
    registerLog.set(ip, recent);
    changed();
    return { token: createSession(user) };
});

route('POST', /^\/api\/login$/, (req, body) => {
    const username = str(body.username, 24).toLowerCase();
    const user = Object.values(db.users).find(u => u.username === username);
    const password = typeof body.password === 'string' ? body.password : '';
    const ok = user && user.hash && crypto.timingSafeEqual(
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
    // Discord 로그인으로 확인된 ID는 직접 바꿀 수 없음 (연결을 끊으면 다시 입력 가능)
    if (body.discord !== undefined && !u.discord?.verified) {
        const handle = str(body.discord, 40);
        if (handle && !/^[\w.#]+$/.test(handle)) fail(400, 'invalid_discord');
        u.discord = handle ? { handle, verified: false } : null;
    }
    if (body.discordVisibility !== undefined) {
        const v = body.discordVisibility || {};
        u.discordVisibility = { everyone: !!v.everyone, friends: !!v.friends, party: !!v.party };
    }
    if (body.password !== undefined) {
        // 비밀번호가 이미 있으면 현재 비밀번호 확인 (소셜 로그인만 쓰던 계정은 바로 설정)
        if (u.hash && hashPassword(String(body.currentPassword || ''), u.salt) !== u.hash) fail(401, 'bad_credentials');
        const password = String(body.password);
        if (password.length < 8 || password.length > 200) fail(400, 'weak_password');
        u.salt = crypto.randomBytes(16).toString('hex');
        u.hash = hashPassword(password, u.salt);
    }
    changed();
    return { ok: true };
});

route('POST', /^\/api\/me\/avatar$/, (req, body) => {
    const u = auth(req);
    u.avatar = body.image ? saveImage(body.image) : '';
    changed();
    return { avatar: u.avatar };
});

// ===== 친구 =====
// 신청 → 상대가 같은 요청을 보내면 수락. DELETE 는 신청 취소 · 거절 · 친구 끊기
route('POST', /^\/api\/friends\/(\w+)$/, (req, body, [uid]) => {
    const u = auth(req);
    if (!db.users[uid] || uid === u.id) fail(404, 'user_not_found');
    const key = friendKey(u.id, uid);
    const f = db.friends[key];
    if (!f) db.friends[key] = { from: u.id, to: uid, status: 'pending', createdAt: Date.now() };
    else if (f.status === 'pending' && f.to === u.id) f.status = 'accepted';
    changed();
    return { status: db.friends[key].status };
});

route('DELETE', /^\/api\/friends\/(\w+)$/, (req, body, [uid]) => {
    const u = auth(req);
    delete db.friends[friendKey(u.id, uid)];
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
    const leaderTitle = body.leaderTitle !== undefined ? str(body.leaderTitle, 20) : (party.leaderTitle || '');
    const lower = name.toLowerCase();
    if (Object.values(db.parties).some(p => p.id !== party.id && !p.dissolvedAt && p.name.toLowerCase() === lower)) {
        fail(409, 'party_name_taken');
    }
    return { name, abbr, color: color.toLowerCase(), ideology, description, links, leaderTitle };
}

route('POST', /^\/api\/parties$/, (req, body) => {
    const u = auth(req);
    if (db.parties[u.partyId]?.leaderId === u.id) fail(400, 'leader_cannot_leave');
    const fields = readPartyFields(body);
    const party = migrateParty({ id: nextId('p'), ...fields, leaderId: u.id, createdAt: Date.now() });
    db.parties[party.id] = party;
    joinParty(u, party);
    changed();
    return party;
});

function getParty(id) {
    const p = db.parties[id];
    return p && !p.dissolvedAt ? p : fail(404, 'party_not_found');
}

// 정당 정보(edit_info) · 공지(announce) · 입당 방식(approve_join)을 각각의 권한으로 수정
route('PATCH', /^\/api\/parties\/(\w+)$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    const infoKeys = ['name', 'abbr', 'color', 'ideology', 'description', 'links', 'leaderTitle'];
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

route('POST', /^\/api\/parties\/(\w+)\/logo$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    requirePerm(party, u, 'edit_info');
    party.logo = body.image ? saveImage(body.image) : '';
    changed();
    return { logo: party.logo };
});

// 정당 해산: 대표만. 당원은 모두 무소속이 되고, 지난 표결 기록을 위해 정당 정보는 남겨 둠
route('POST', /^\/api\/parties\/(\w+)\/dissolve$/, (req, body, [id]) => {
    const u = auth(req);
    const party = getParty(id);
    if (party.leaderId !== u.id) fail(403, 'leader_only');
    for (const m of partyMembers(party.id)) {
        m.partyId = null;
        m.partyRoleId = null;
        m.partyJoinedAt = null;
    }
    party.dissolvedAt = Date.now();
    party.requests = {};
    changed();
    return { ok: true };
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
    const open = Object.values(db.agendas).filter(a => a.authorId === u.id && (a.status === 'open' || a.status === 'proposed'));
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
        status: 'proposed',
        support: { [u.id]: 1 },   // 발의자는 첫 추천인
        hours,                    // 상정되면 이 시간 동안 표결
        openedAt: null,
        closesAt: null,
        votes: {},
        whips: {},      // partyId -> 당론 'yea' | 'nay' | 'abs'
        snapshot: null,
    };
    db.agendas[agenda.id] = agenda;
    maybeOpen(agenda);
    changed();
    return summarizeAgenda(agenda, u);
});

function getAgenda(id) {
    return db.agendas[id] || fail(404, 'agenda_not_found');
}

route('GET', /^\/api\/agendas\/(\w+)$/, (req, body, [id]) => {
    const a = getAgenda(id);
    const viewer = auth(req, { optional: true });
    return { ...summarizeAgenda(a, viewer), body: a.body, votes: a.votes, whips: a.whips, snapshot: a.snapshot };
});

// 추천(1) / 비추천(-1) / 취소(0) — 추천 단계에서만
route('POST', /^\/api\/agendas\/(\w+)\/support$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    if (a.status !== 'proposed') fail(400, 'not_in_proposal');
    const v = Number(body.value);
    if (![1, -1, 0].includes(v)) fail(400, 'invalid_choice');
    if (v === 0) delete a.support[u.id];
    else a.support[u.id] = v;
    maybeOpen(a);
    changed();
    return summarizeAgenda(a, u);
});

// choice: 'yea' | 'nay' | 'abs' | null(철회). 첫 투표는 마감 전까지, 변경 · 철회는 표 변경 마감 전까지
route('POST', /^\/api\/agendas\/(\w+)\/vote$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    if (a.status !== 'open' || a.closesAt <= Date.now()) fail(400, 'agenda_closed');
    if (body.choice !== null && !['yea', 'nay', 'abs'].includes(body.choice)) fail(400, 'invalid_choice');
    if (a.votes[u.id] && Date.now() >= voteLockAt(a)) fail(400, 'vote_locked');
    if (body.choice === null) delete a.votes[u.id];
    else a.votes[u.id] = body.choice;
    changed();
    return summarizeAgenda(a, u);
});

// 당론 지정 (set_whip). choice 'free' 면 자유 투표로 되돌림
route('POST', /^\/api\/agendas\/(\w+)\/whip$/, (req, body, [id]) => {
    const u = auth(req);
    const a = getAgenda(id);
    // 추천 단계에서도 미리 당론을 정할 수 있음
    if (!(a.status === 'proposed' || (a.status === 'open' && a.closesAt > Date.now()))) fail(400, 'agenda_closed');
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
    if (a.status !== 'open' && a.status !== 'proposed') fail(400, 'agenda_closed');
    a.status = 'withdrawn';
    changed();
    return summarizeAgenda(a, u);
});

// ===== 이미지 (프로필 사진 · 정당 로고) =====
// 브라우저가 256px로 줄여 data URL로 보냄 → 파일 내용으로 형식을 확인해 data/uploads 에 저장
const IMAGE_TYPES = {
    png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    webp: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
    gif: (b) => b.toString('ascii', 0, 4) === 'GIF8',
};
const MAX_IMAGE_BYTES = 300 * 1024;

function saveImage(dataUrl) {
    const m = /^data:image\/[\w+.-]+;base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === 'string' ? dataUrl : '');
    if (!m) fail(400, 'invalid_image');
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length > MAX_IMAGE_BYTES) fail(413, 'image_too_large');
    const ext = Object.keys(IMAGE_TYPES).find(k => IMAGE_TYPES[k](buf));
    if (!ext) fail(400, 'invalid_image');
    const name = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 32) + '.' + ext;
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return '/uploads/' + name;
}

// ===== Discord / Google 로그인 (OAuth 2.0) =====
// 환경 변수에 클라이언트 ID · 시크릿이 있는 제공자만 켜짐. 리디렉션 주소: PUBLIC_URL/auth/<provider>/callback
const OAUTH = {
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID, clientSecret: process.env.DISCORD_CLIENT_SECRET,
        authUrl: 'https://discord.com/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        userUrl: 'https://discord.com/api/users/@me',
        scope: 'identify',
        profile: (d) => ({
            id: d.id, handle: d.username, name: d.global_name || d.username,
            avatar: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=256` : '',
        }),
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid profile',
        profile: (d) => ({ id: d.sub, handle: '', name: d.name || 'deputy', avatar: d.picture || '' }),
    },
};
const oauthStates = new Map(); // state -> { provider, linkUserId, expires }

function getProvider(name) {
    const p = OAUTH[name];
    return p && p.clientId ? p : fail(404, 'provider_disabled');
}
const redirectUri = (provider) => `${PUBLIC_URL}/auth/${provider}/callback`;

// 로그인 중이면 "계정에 연결", 아니면 "로그인 · 가입"
route('POST', /^\/api\/oauth\/(\w+)\/start$/, (req, body, [provider]) => {
    const p = getProvider(provider);
    const user = auth(req, { optional: true });
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, { provider, linkUserId: user?.id || null, expires: Date.now() + 10 * 60e3 });
    const url = new URL(p.authUrl);
    url.search = new URLSearchParams({
        client_id: p.clientId, redirect_uri: redirectUri(provider), response_type: 'code', scope: p.scope, state, prompt: 'consent',
    });
    return { url: url.href };
});

route('POST', /^\/api\/oauth\/(\w+)\/unlink$/, (req, body, [provider]) => {
    const u = auth(req);
    if (!u.oauth[provider]) return { ok: true };
    // 비밀번호도 다른 연결도 없으면 로그인할 방법이 사라지므로 막음
    if (!u.hash && Object.keys(u.oauth).length <= 1) fail(400, 'last_login_method');
    delete u.oauth[provider];
    if (provider === 'discord' && u.discord?.verified) u.discord = null;
    changed();
    return { ok: true };
});

function uniqueUsername(base) {
    const clean = (base || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'deputy';
    const taken = (n) => Object.values(db.users).some(u => u.username === n);
    let name = clean.length >= 3 ? clean : clean + '_hn';
    while (taken(name)) name = `${clean.slice(0, 18)}_${crypto.randomBytes(2).toString('hex')}`;
    return name;
}

async function oauthCallback(provider, params) {
    const st = oauthStates.get(params.get('state'));
    oauthStates.delete(params.get('state'));
    if (!st || st.provider !== provider || st.expires < Date.now()) fail(400, 'oauth_state');
    const p = getProvider(provider);
    const tokenRes = await fetch(p.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
            client_id: p.clientId, client_secret: p.clientSecret, grant_type: 'authorization_code',
            code: params.get('code') || '', redirect_uri: redirectUri(provider),
        }),
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) fail(400, 'oauth_failed');
    const userRes = await fetch(p.userUrl, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
    if (!userRes.ok) fail(400, 'oauth_failed');
    const prof = p.profile(await userRes.json());

    const owner = Object.values(db.users).find(u => u.oauth[provider]?.id === prof.id);
    const link = { id: prof.id, handle: prof.handle, name: prof.name };
    const applyProfile = (u) => {
        u.oauth[provider] = link;
        if (!u.avatar && prof.avatar) u.avatar = prof.avatar;
        if (provider === 'discord') u.discord = { handle: prof.handle, verified: true };
    };

    if (st.linkUserId) {
        const me = db.users[st.linkUserId] || fail(400, 'oauth_state');
        if (owner && owner.id !== me.id) fail(409, 'oauth_taken');
        applyProfile(me);
        changed();
        return `#/me/linked/${provider}`;
    }
    let user = owner;
    if (user) {
        if (provider === 'discord') user.discord = { handle: prof.handle, verified: true };
    } else {
        user = migrateUser({
            id: nextId('u'), username: uniqueUsername(prof.handle || prof.name), name: (prof.name || 'deputy').slice(0, 40),
            country: '', salt: null, hash: null, partyId: null, partyJoinedAt: null, createdAt: Date.now(),
        });
        applyProfile(user);
        db.users[user.id] = user;
    }
    changed();
    return `#/auth/${createSession(user)}`;
}

// ===== HTTP =====
const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
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
            if (size > 512 * 1024) { reject(new ApiError(413, 'too_large')); req.destroy(); return; }
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
        const cb = /^\/auth\/(\w+)\/callback$/.exec(pathname);
        if (cb) {
            const params = new URL(req.url, 'http://localhost').searchParams;
            oauthCallback(cb[1], params)
                .then(hash => res.writeHead(302, { Location: '/' + hash }).end())
                .catch(e => {
                    if (!(e instanceof ApiError)) console.error(e);
                    res.writeHead(302, { Location: `/#/me/error/${e instanceof ApiError ? e.code : 'oauth_failed'}` }).end();
                });
            return;
        }
        const up = /^\/uploads\/([0-9a-f]{32}\.(png|jpg|webp|gif))$/.exec(pathname);
        if (up) {
            fs.readFile(path.join(UPLOAD_DIR, up[1]), (err, data) => {
                if (err) { res.writeHead(404).end(); return; }
                res.writeHead(200, { 'Content-Type': MIME['.' + up[2]], 'Cache-Control': 'public, max-age=31536000, immutable' });
                res.end(data);
            });
            return;
        }
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

module.exports = { createServer, loadDb, RULES, OAUTH, getDb: () => db };
