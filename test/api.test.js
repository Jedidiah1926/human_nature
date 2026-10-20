'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.REGISTER_PER_HOUR = '0';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hn-test-'));
const { createServer } = require('../server.js');

let base;
const server = createServer();
test.before(() => new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => server.close());

async function call(method, url, body, token) {
    const res = await fetch(base + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
}

test('parties, membership and voting', async () => {
    const a = (await call('POST', '/api/register', { username: 'alice', password: 'password1', name: 'Alice', country: 'kr' })).body.token;
    const b = (await call('POST', '/api/register', { username: 'bob', password: 'password2', country: 'US' })).body.token;
    assert.ok(a && b);
    assert.equal((await call('POST', '/api/register', { username: 'alice', password: 'password1' })).status, 409);
    assert.equal((await call('POST', '/api/login', { username: 'alice', password: 'nope' })).status, 401);
    assert.equal((await call('POST', '/api/login', { username: 'ALICE', password: 'password1' })).status, 200);

    const bad = await call('POST', '/api/parties', { name: 'X Party', color: '#ff0000', ideology: 0, links: { discord: 'javascript:alert(1)' } }, a);
    assert.equal(bad.body.error, 'invalid_link');

    const party = (await call('POST', '/api/parties', {
        name: 'Green Earth', abbr: 'GE', color: '#00aa44', ideology: -30,
        links: { discord: 'https://discord.gg/abc', reddit: 'https://reddit.com/r/greenearth' },
    }, a)).body;
    assert.equal(party.leaderId.startsWith('u'), true);
    assert.equal((await call('PATCH', `/api/parties/${party.id}`, { name: 'Hijack' }, b)).status, 403);

    await call('POST', `/api/parties/${party.id}/join`, null, b);
    let state = (await call('GET', '/api/state')).body;
    assert.equal(state.parties[0].seats, 2);

    // 대표가 탈당하면 승계, 마지막 당원이 떠나면 해산
    await call('POST', '/api/parties/leave', null, a);
    state = (await call('GET', '/api/state')).body;
    const bobId = state.members.find(m => m.name === 'bob').id;
    assert.equal(state.parties[0].leaderId, bobId);
    await call('POST', '/api/parties/leave', null, b);
    assert.equal((await call('GET', '/api/state')).body.parties.length, 0);

    const agenda = (await call('POST', '/api/agendas', { title: 'Ban daylight saving time', body: 'Pick one time.', hours: 1 }, a)).body;
    assert.equal(agenda.status, 'open');
    await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: 'yea' }, a);
    await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: 'nay' }, b);
    await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: 'yea' }, b); // 표 변경
    assert.equal((await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: 'maybe' }, b)).status, 400);
    const detail = (await call('GET', `/api/agendas/${agenda.id}`)).body;
    assert.deepEqual(detail.tally, { yea: 2, nay: 0, abs: 0 });
    assert.equal((await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: 'yea' })).status, 401);
});

test('party roles, permissions and whip', async () => {
    const reg = async (n) => (await call('POST', '/api/register', { username: n, password: 'password1', name: n })).body.token;
    const lead = await reg('lead'), dep = await reg('dep'), mem = await reg('mem'), out = await reg('outsider');
    const ids = Object.fromEntries((await call('GET', '/api/state')).body.members.map(m => [m.name, m.id]));
    const party = (await call('POST', '/api/parties', { name: 'Role Party', color: '#123456', ideology: 10 }, lead)).body;
    const P = `/api/parties/${party.id}`;

    // 입당 승인제
    await call('PATCH', P, { joinPolicy: 'approval' }, lead);
    assert.deepEqual((await call('POST', `${P}/join`, null, dep)).body, { pending: true });
    await call('POST', `${P}/join`, null, mem);
    await call('POST', `${P}/requests/${ids.dep}/approve`, null, lead);
    await call('POST', `${P}/requests/${ids.mem}/approve`, null, lead);

    // 직책: 부대표(정당 수정·직책 관리·당원 관리)와 대변인(공지)
    const vice = (await call('POST', `${P}/roles`, { name: 'Vice', perms: ['edit_info', 'manage_roles', 'manage_members'] }, lead)).body;
    const spokes = (await call('POST', `${P}/roles`, { name: 'Spokes', perms: ['announce'] }, lead)).body;
    assert.equal((await call('POST', `${P}/roles`, { name: 'X', perms: [] }, mem)).status, 403);
    await call('POST', `${P}/members/${ids.dep}/role`, { roleId: vice.id }, lead);

    // 부대표는 아래 서열에만 임명 가능, 자기 직책·대표는 못 건드림
    assert.equal((await call('POST', `${P}/members/${ids.mem}/role`, { roleId: spokes.id }, dep)).status, 200);
    assert.equal((await call('POST', `${P}/members/${ids.mem}/role`, { roleId: vice.id }, dep)).status, 403);
    assert.equal((await call('POST', `${P}/members/${ids.lead}/kick`, null, dep)).body.error, 'rank_too_low');
    // 가지지 않은 권한은 줄 수 없음
    assert.equal((await call('PATCH', `${P}/roles/${spokes.id}`, { perms: ['set_whip'] }, dep)).status, 403);

    assert.equal((await call('PATCH', P, { notice: 'Hello' }, mem)).status, 200);
    assert.equal((await call('PATCH', P, { name: 'Renamed' }, mem)).status, 403);
    assert.equal((await call('PATCH', P, { description: 'by vice' }, dep)).status, 200);

    // 제명 후 24시간 재입당 금지
    await call('POST', `${P}/members/${ids.mem}/kick`, null, dep);
    await call('PATCH', P, { joinPolicy: 'open' }, lead);
    assert.equal((await call('POST', `${P}/join`, null, mem)).body.error, 'kicked_recently');

    // 당론
    const ag = (await call('POST', '/api/agendas', { title: 'Whip test', hours: 1 }, out)).body;
    assert.equal((await call('POST', `/api/agendas/${ag.id}/whip`, { choice: 'yea' }, dep)).status, 403);
    await call('POST', `/api/agendas/${ag.id}/whip`, { choice: 'nay' }, lead);
    assert.deepEqual((await call('GET', `/api/agendas/${ag.id}`)).body.whips, { [party.id]: 'nay' });

    // 대표 직접 위임 → 이전 대표는 지정 직책으로, 그 뒤 대표가 탈당하면 서열 최상위가 승계
    await call('POST', `${P}/leader`, { userId: ids.dep, keepRoleId: vice.id }, lead);
    let st = (await call('GET', '/api/state')).body;
    assert.equal(st.parties.find(p => p.id === party.id).leaderId, ids.dep);
    assert.equal(st.members.find(m => m.id === ids.lead).partyRoleId, vice.id);
    await call('POST', '/api/parties/leave', null, dep);
    st = (await call('GET', '/api/state')).body;
    assert.equal(st.parties.find(p => p.id === party.id).leaderId, ids.lead);
});
