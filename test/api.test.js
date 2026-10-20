'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
