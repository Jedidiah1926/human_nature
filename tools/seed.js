// 데모용 데이터 채우기: 실행 중인 서버에 가상 의원·정당·의제를 만든다.
// 사용법: REGISTER_PER_HOUR=0 npm start 로 서버를 켠 뒤  node tools/seed.js [의원 수] [서버 주소]
'use strict';

const COUNT = Number(process.argv[2]) || 120;
const BASE = process.argv[3] || 'http://localhost:3000';
const COUNTRIES = ['KR', 'US', 'JP', 'DE', 'FR', 'BR', 'IN', 'NG', 'GB', 'MX', 'ID', 'TR', 'PL', 'AU', 'CA', 'EG', 'VN', 'AR'];
const PARTIES = [
    { name: 'Workers of the World', abbr: 'WW', color: '#d62839', ideology: -80 },
    { name: 'Green Earth Alliance', abbr: 'GEA', color: '#2bb673', ideology: -40 },
    { name: 'Global Liberal Forum', abbr: 'GLF', color: '#f5c518', ideology: 5 },
    { name: 'Federalist Union', abbr: 'FU', color: '#3a7bd5', ideology: 45 },
    { name: 'Tradition & Nation', abbr: 'TN', color: '#6b3fa0', ideology: 80 },
];

async function call(method, url, body, token) {
    const res = await fetch(BASE + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const out = await res.json();
    if (!res.ok) throw new Error(`${method} ${url}: ${out.error}`);
    return out;
}

(async () => {
    const run = Date.now().toString(36);
    const tokens = [];
    for (let i = 0; i < COUNT; i++) {
        const { token } = await call('POST', '/api/register', {
            username: `demo_${run}_${i}`, password: 'demo-password', name: `Deputy ${i + 1}`,
            country: COUNTRIES[i % COUNTRIES.length],
        }).catch(e => { console.error(e.message); return {}; });
        if (token) tokens.push(token);
    }
    const parties = [];
    for (let i = 0; i < PARTIES.length && i < tokens.length; i++) {
        parties.push(await call('POST', '/api/parties', {
            ...PARTIES[i], description: 'Demo party.', links: { discord: 'https://discord.gg/example' },
        }, tokens[i]));
    }
    const weights = [0.12, 0.2, 0.25, 0.18, 0.1]; // 나머지는 무소속
    for (let i = parties.length; i < tokens.length; i++) {
        let r = Math.random(), k = 0;
        while (k < weights.length && r > weights[k]) { r -= weights[k]; k++; }
        if (k < parties.length) await call('POST', `/api/parties/${parties[k].id}/join`, null, tokens[i]);
    }
    // 첫 정당에 직책 몇 개와 당론
    const P = `/api/parties/${parties[0].id}`;
    const vice = await call('POST', `${P}/roles`, { name: 'Deputy Leader', perms: ['edit_info', 'announce', 'approve_join', 'manage_members', 'manage_roles'] }, tokens[0]);
    const whip = await call('POST', `${P}/roles`, { name: 'Chief Whip', perms: ['set_whip'] }, tokens[0]);
    await call('PATCH', P, { notice: 'Weekly meeting on Discord every Sunday 12:00 UTC.' }, tokens[0]);
    const firstMembers = (await call('GET', '/api/state')).members.filter(m => m.partyId === parties[0].id && m.id !== parties[0].leaderId);
    if (firstMembers[0]) await call('POST', `${P}/members/${firstMembers[0].id}/role`, { roleId: vice.id }, tokens[0]);
    if (firstMembers[1]) await call('POST', `${P}/members/${firstMembers[1].id}/role`, { roleId: whip.id }, tokens[0]);
    const agenda = await call('POST', '/api/agendas', {
        title: 'Adopt a universal calendar for the World Assembly',
        body: 'All assembly deadlines use UTC and the ISO 8601 calendar.', hours: 48,
    }, tokens[0]);
    await call('POST', `/api/agendas/${agenda.id}/whip`, { choice: 'nay' }, tokens[0]);
    // 추천을 모아 본회의 상정
    for (const tk of tokens.slice(1)) {
        const a = await call('POST', `/api/agendas/${agenda.id}/support`, { value: 1 }, tk);
        if (a.status === 'open') break;
    }
    // 추천 단계에 머무는 의제 하나
    const pending = await call('POST', '/api/agendas', { title: 'Make Esperanto the second assembly language', hours: 72 }, tokens[1]);
    for (const tk of tokens.slice(2, 4)) await call('POST', `/api/agendas/${pending.id}/support`, { value: 1 }, tk);
    await call('POST', `/api/agendas/${pending.id}/support`, { value: -1 }, tokens[5]);
    for (const tk of tokens) {
        const r = Math.random();
        if (r < 0.15) continue;
        await call('POST', `/api/agendas/${agenda.id}/vote`, { choice: r < 0.6 ? 'yea' : r < 0.9 ? 'nay' : 'abs' }, tk);
    }
    console.log(`seeded ${tokens.length} deputies, ${parties.length} parties, agenda ${agenda.id}`);
})();
