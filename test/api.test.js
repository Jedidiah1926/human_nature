'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

process.env.REGISTER_PER_HOUR = '0';
process.env.SPONSOR_MIN = '2';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hn-test-'));
const { createServer, OAUTH, getDb } = require('../server.js');

let base;
const server = createServer();
test.before(() => new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => server.close());

async function call(method, url, body, token) {
    const res = await fetch(base + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
        redirect: 'manual',
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, body: json, headers: res.headers };
}

let n = 0;
async function reg(name) {
    const username = `${name}_${++n}`;
    const token = (await call('POST', '/api/register', { username, password: 'password1', name })).body.token;
    const me = (await call('GET', '/api/me', null, token)).body;
    return { token, id: me.id };
}

test('accounts and party membership', async () => {
    const a = await reg('alice'), b = await reg('bob');
    assert.equal((await call('POST', '/api/register', { username: 'alice_1', password: 'password1' })).status, 409);
    assert.equal((await call('POST', '/api/login', { username: 'alice_1', password: 'nope' })).status, 401);
    assert.equal((await call('POST', '/api/login', { username: 'ALICE_1', password: 'password1' })).status, 200);

    const bad = await call('POST', '/api/parties', { name: 'X Party', color: '#ff0000', ideology: 0, links: { discord: 'javascript:alert(1)' } }, a.token);
    assert.equal(bad.body.error, 'invalid_link');

    const party = (await call('POST', '/api/parties', {
        name: 'Green Earth', abbr: 'GE', color: '#00aa44', ideology: -30, leaderTitle: '총재',
        links: { discord: 'https://discord.gg/abc' },
    }, a.token)).body;
    assert.equal(party.leaderTitle, '총재');
    assert.equal((await call('PATCH', `/api/parties/${party.id}`, { name: 'Hijack' }, b.token)).status, 403);
    await call('POST', `/api/parties/${party.id}/join`, null, b.token);
    assert.equal((await call('GET', '/api/state')).body.parties.find(p => p.id === party.id).seats, 2);

    // 대표는 탈당 · 다른 당 입당 · 새 창당 불가
    assert.equal((await call('POST', '/api/parties/leave', null, a.token)).body.error, 'leader_cannot_leave');
    assert.equal((await call('POST', '/api/parties', { name: 'Another', color: '#111111', ideology: 0 }, a.token)).body.error, 'leader_cannot_leave');
    assert.equal((await call('POST', '/api/parties/leave', null, b.token)).status, 200);

    // 해산: 대표만, 당원은 무소속, 같은 이름으로 다시 창당 가능
    await call('POST', `/api/parties/${party.id}/join`, null, b.token);
    assert.equal((await call('POST', `/api/parties/${party.id}/dissolve`, null, b.token)).status, 403);
    assert.equal((await call('POST', `/api/parties/${party.id}/dissolve`, null, a.token)).status, 200);
    const st = (await call('GET', '/api/state')).body;
    assert.ok(st.parties.find(p => p.id === party.id).dissolvedAt);
    assert.ok(st.members.filter(m => [a.id, b.id].includes(m.id)).every(m => m.partyId === null));
    assert.equal((await call('POST', `/api/parties/${party.id}/join`, null, b.token)).status, 404);
    assert.equal((await call('POST', '/api/parties', { name: 'Green Earth', color: '#00aa44', ideology: 0 }, b.token)).status, 200);
});

test('bill: support → floor → vote lock', async () => {
    const a = await reg('author'), b = await reg('supporter'), c = await reg('critic');
    const ag = (await call('POST', '/api/agendas', { title: 'Ban daylight saving time', hours: 24 }, a.token)).body;
    assert.equal(ag.status, 'proposed');
    assert.deepEqual(ag.support, { up: 1, down: 0 });
    assert.equal((await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'yea' }, b.token)).body.error, 'agenda_closed');

    // 필요 추천 수 = max(SPONSOR_MIN=2, 재적 × 5%) — 비추천이 같으면 상정 안 됨
    const need = (await call('GET', '/api/state')).body.rules.sponsorsNeeded;
    await call('POST', `/api/agendas/${ag.id}/support`, { value: -1 }, c.token);
    let cur = (await call('POST', `/api/agendas/${ag.id}/support`, { value: 1 }, b.token)).body;
    if (need <= 2) assert.equal(cur.status, 'open');
    else assert.equal(cur.status, 'proposed');
    // 비추천 취소
    cur = (await call('POST', `/api/agendas/${ag.id}/support`, { value: 0 }, c.token)).body;

    const db = getDb();
    db.agendas[ag.id].status = 'proposed';
    db.agendas[ag.id].support = Object.fromEntries(Object.keys(db.users).slice(0, need).map(id => [id, 1]));
    cur = (await call('POST', `/api/agendas/${ag.id}/support`, { value: 1 }, a.token)).body;
    assert.equal(cur.status, 'open');
    assert.equal(cur.closesAt - cur.openedAt, 24 * 3600e3);
    assert.equal(cur.closesAt - cur.lockAt, 12 * 3600e3);

    await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'yea' }, b.token);
    await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'nay' }, b.token);
    await call('POST', `/api/agendas/${ag.id}/vote`, { choice: null }, b.token); // 철회
    assert.deepEqual((await call('GET', `/api/agendas/${ag.id}`)).body.tally, { yea: 0, nay: 0, abs: 0 });
    await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'yea' }, b.token);

    // 표 변경 마감 이후: 첫 투표는 되고, 변경 · 철회는 안 됨
    db.agendas[ag.id].openedAt -= 13 * 3600e3;
    db.agendas[ag.id].closesAt -= 13 * 3600e3;
    assert.equal((await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'nay' }, b.token)).body.error, 'vote_locked');
    assert.equal((await call('POST', `/api/agendas/${ag.id}/vote`, { choice: null }, b.token)).body.error, 'vote_locked');
    assert.equal((await call('POST', `/api/agendas/${ag.id}/vote`, { choice: 'nay' }, c.token)).status, 200);

    // 추천 단계 기한이 지나면 폐기
    const old = (await call('POST', '/api/agendas', { title: 'Forgotten bill', hours: 1 }, c.token)).body;
    db.agendas[old.id].createdAt -= 8 * 86400e3;
    assert.equal((await call('GET', `/api/agendas/${old.id}`)).body.status, 'expired');
});

test('party roles, permissions and whip', async () => {
    const lead = await reg('lead'), dep = await reg('dep'), mem = await reg('mem'), out = await reg('outsider');
    const party = (await call('POST', '/api/parties', { name: 'Role Party', color: '#123456', ideology: 10 }, lead.token)).body;
    const P = `/api/parties/${party.id}`;

    await call('PATCH', P, { joinPolicy: 'approval' }, lead.token);
    assert.deepEqual((await call('POST', `${P}/join`, null, dep.token)).body, { pending: true });
    await call('POST', `${P}/join`, null, mem.token);
    await call('POST', `${P}/requests/${dep.id}/approve`, null, lead.token);
    await call('POST', `${P}/requests/${mem.id}/approve`, null, lead.token);

    const vice = (await call('POST', `${P}/roles`, { name: 'Vice', perms: ['edit_info', 'manage_roles', 'manage_members'] }, lead.token)).body;
    const spokes = (await call('POST', `${P}/roles`, { name: 'Spokes', perms: ['announce'] }, lead.token)).body;
    assert.equal((await call('POST', `${P}/roles`, { name: 'X', perms: [] }, mem.token)).status, 403);
    await call('POST', `${P}/members/${dep.id}/role`, { roleId: vice.id }, lead.token);

    assert.equal((await call('POST', `${P}/members/${mem.id}/role`, { roleId: spokes.id }, dep.token)).status, 200);
    assert.equal((await call('POST', `${P}/members/${mem.id}/role`, { roleId: vice.id }, dep.token)).status, 403);
    assert.equal((await call('POST', `${P}/members/${lead.id}/kick`, null, dep.token)).body.error, 'rank_too_low');
    assert.equal((await call('PATCH', `${P}/roles/${spokes.id}`, { perms: ['set_whip'] }, dep.token)).status, 403);

    assert.equal((await call('PATCH', P, { notice: 'Hello' }, mem.token)).status, 200);
    assert.equal((await call('PATCH', P, { name: 'Renamed' }, mem.token)).status, 403);
    assert.equal((await call('PATCH', P, { leaderTitle: 'Chair' }, dep.token)).status, 200);

    await call('POST', `${P}/members/${mem.id}/kick`, null, dep.token);
    await call('PATCH', P, { joinPolicy: 'open' }, lead.token);
    assert.equal((await call('POST', `${P}/join`, null, mem.token)).body.error, 'kicked_recently');

    const ag = (await call('POST', '/api/agendas', { title: 'Whip test', hours: 1 }, out.token)).body;
    assert.equal((await call('POST', `/api/agendas/${ag.id}/whip`, { choice: 'yea' }, dep.token)).status, 403);

    // 대표 위임 → 이전 대표는 지정 직책, 새 대표는 탈당 불가
    await call('POST', `${P}/leader`, { userId: dep.id, keepRoleId: vice.id }, lead.token);
    const st = (await call('GET', '/api/state')).body;
    assert.equal(st.parties.find(p => p.id === party.id).leaderId, dep.id);
    assert.equal(st.members.find(m => m.id === lead.id).partyRoleId, vice.id);
    assert.equal((await call('POST', '/api/parties/leave', null, dep.token)).body.error, 'leader_cannot_leave');
    assert.equal((await call('POST', '/api/parties/leave', null, lead.token)).status, 200);
});

test('profile: avatar, friends, discord visibility', async () => {
    const a = await reg('owner'), friend = await reg('friend'), mate = await reg('mate'), stranger = await reg('stranger');
    const png = 'data:image/png;base64,' + Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]).toString('base64');
    const { avatar } = (await call('POST', '/api/me/avatar', { image: png }, a.token)).body;
    assert.match(avatar, /^\/uploads\/[0-9a-f]{32}\.png$/);
    assert.equal((await fetch(base + avatar)).status, 200);
    assert.equal((await call('POST', '/api/me/avatar', { image: 'data:image/png;base64,PHN2Zz4=' }, a.token)).body.error, 'invalid_image');

    // 친구: 신청 → 상대가 신청하면 수락
    await call('POST', `/api/friends/${friend.id}`, null, a.token);
    assert.deepEqual((await call('GET', '/api/me', null, friend.token)).body.friends, [{ userId: a.id, status: 'incoming' }]);
    assert.equal((await call('POST', `/api/friends/${a.id}`, null, friend.token)).body.status, 'accepted');

    const party = (await call('POST', '/api/parties', { name: 'Visibility Party', color: '#222222', ideology: 0 }, a.token)).body;
    await call('POST', `/api/parties/${party.id}/join`, null, mate.token);

    const seen = async (viewer) => (await call('GET', '/api/state', null, viewer?.token)).body.members.find(m => m.id === a.id).discord;
    await call('PATCH', '/api/me', { discord: 'owner.dc', discordVisibility: { everyone: false, friends: true, party: false } }, a.token);
    assert.deepEqual(await seen(a), { handle: 'owner.dc', verified: false });
    assert.ok(await seen(friend));
    assert.equal(await seen(mate), null);
    assert.equal(await seen(stranger), null);
    assert.equal(await seen(null), null);

    await call('PATCH', '/api/me', { discordVisibility: { friends: false, party: true } }, a.token);
    assert.equal(await seen(friend), null);
    assert.ok(await seen(mate));

    await call('PATCH', '/api/me', { discordVisibility: { everyone: true } }, a.token);
    assert.ok(await seen(null));

    await call('DELETE', `/api/friends/${a.id}`, null, friend.token);
    assert.deepEqual((await call('GET', '/api/me', null, a.token)).body.friends, []);
});

test('discord login with a mock provider', async () => {
    // 가짜 Discord: 토큰 교환과 사용자 정보만 흉내
    const mock = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.url === '/token') return res.end(JSON.stringify({ access_token: 'tok' }));
        res.end(JSON.stringify({ id: '424242', username: 'pilcrow', global_name: 'Pilcrow', avatar: null }));
    });
    await new Promise(r => mock.listen(0, r));
    const mb = `http://127.0.0.1:${mock.address().port}`;
    Object.assign(OAUTH.discord, { clientId: 'cid', clientSecret: 'sec', tokenUrl: mb + '/token', userUrl: mb + '/me' });
    try {
        assert.ok((await call('GET', '/api/state')).body.rules.oauth.includes('discord'));
        const login = async (token) => {
            const { url } = (await call('POST', '/api/oauth/discord/start', null, token)).body;
            const state = new URL(url).searchParams.get('state');
            const res = await call('GET', `/auth/discord/callback?code=abc&state=${state}`);
            return res.headers.get('location');
        };
        const loc = await login();
        const token = /^\/#\/auth\/(\w+)$/.exec(loc)[1];
        const me = (await call('GET', '/api/me', null, token)).body;
        assert.equal(me.username, 'pilcrow');
        assert.deepEqual(me.discord, { handle: 'pilcrow', verified: true });
        assert.equal(me.hasPassword, false);
        // 다시 로그인하면 같은 계정
        assert.equal((await call('GET', '/api/me', null, /^\/#\/auth\/(\w+)$/.exec(await login())[1])).body.id, me.id);
        // 확인된 디스코드 ID는 직접 못 바꿈, 유일한 로그인 수단은 못 끊음
        await call('PATCH', '/api/me', { discord: 'fake' }, token);
        assert.equal((await call('GET', '/api/me', null, token)).body.discord.handle, 'pilcrow');
        assert.equal((await call('POST', '/api/oauth/discord/unlink', null, token)).body.error, 'last_login_method');
        // 다른 계정에 같은 디스코드를 연결하려 하면 거절
        const other = await reg('other');
        assert.equal(await login(other.token), '/#/me/error/oauth_taken');
        // 잘못된 state
        assert.equal((await call('GET', '/auth/discord/callback?code=x&state=bad')).headers.get('location'), '/#/me/error/oauth_state');
    } finally {
        OAUTH.discord.clientId = undefined;
        mock.close();
    }
});
