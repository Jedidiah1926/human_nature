// 반원형 의석 배치 — Hemicycle(parliament)의 좌석 배치 방식을 그대로 옮겨 옴.
// 줄 수를 늘려 가며 모든 의석이 들어가는 가장 적은 줄 수를 찾고, 줄마다 둘레에 비례해 의석을 나눈 뒤
// 왼쪽(π)에서 오른쪽(0)으로 각도순 정렬 → 정당별로 부채꼴 모양으로 채워짐.
'use strict';

const Hemicycle = (() => {
    function layout(total, width) {
        const CX = width / 2;
        const CY = width / 2 - 10;
        const minR = width * 0.15;
        const maxR = width / 2 - 10;
        const calc = (rows) => {
            const dotR = Math.max(0.5, (maxR - minR) / rows / 2.2);
            const rRows = [];
            let cap = 0;
            for (let i = 0; i < rows; i++) {
                const r = minR + i * (dotR * 2.2) + dotR;
                const c = Math.floor((Math.PI * r) / (dotR * 2.2));
                rRows.push({ r, c });
                cap += c;
            }
            return { cap, dotR, rRows };
        };
        // 원래는 30줄까지였지만, 전 세계 의원 수천 명도 들어가도록 줄 수 상한을 크게 둠
        let best = null;
        for (let r = 3; r < 400; r++) { const res = calc(r); if (res.cap >= total) { best = res; break; } }
        if (!best) best = calc(400);

        const { dotR, rRows } = best;
        const totalCap = rRows.reduce((a, b) => a + b.c, 0);
        const pts = [];
        let placed = 0;
        rRows.forEach((row, rI) => {
            let count = Math.round(total * (row.c / totalCap));
            if (rI === rRows.length - 1) count = total - placed;
            placed += count;
            for (let i = 0; i < count; i++) {
                const angle = count === 1 ? Math.PI / 2 : Math.PI - (Math.PI / (count - 1)) * i;
                pts.push({ x: CX + row.r * Math.cos(angle), y: CY - row.r * Math.sin(angle), angle });
            }
        });
        pts.sort((a, b) => b.angle - a.angle);
        return { pts, dotR, CX, CY };
    }

    // seats: [{ color, voteColor?, highlight? }] — 왼쪽부터 채울 순서대로
    function draw(canvas, seats, { centerTop = '', centerBottom = '', hovered = -1 } = {}) {
        const width = canvas.parentElement.clientWidth || 600;
        const height = width / 2 + 10;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.height = height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const css = getComputedStyle(document.documentElement);
        const text = css.getPropertyValue('--text').trim() || '#e0e0e0';
        const dim = css.getPropertyValue('--text-dim').trim() || '#888';
        const font = css.getPropertyValue('--font').trim() || 'monospace';

        const { pts, dotR, CX, CY } = layout(seats.length, width);
        canvas._hit = { pts, dotR };

        pts.forEach((pt, i) => {
            const s = seats[i];
            const radius = Math.max(0.5, dotR * 0.85);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = s.voteColor || s.color;
            ctx.fill();
            // 표결 색이 칠해졌으면 정당 색을 테두리로 남겨 소속이 보이게
            if (s.voteColor) {
                ctx.strokeStyle = s.color;
                ctx.lineWidth = Math.min(2.5, Math.max(0.6, dotR * 0.3));
                ctx.stroke();
            }
            if (s.highlight || hovered === i) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, Math.max(dotR * 1.14, 3), 0, Math.PI * 2);
                ctx.strokeStyle = s.highlight ? '#ffd700' : text;
                ctx.lineWidth = 1.5;
                ctx.shadowColor = s.highlight ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.6)';
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = text;
        ctx.font = `${Math.max(18, Math.min(34, width * 0.055))}px ${font}`;
        ctx.fillText(centerTop, CX, CY - 4);
        ctx.fillStyle = dim;
        ctx.font = `${Math.max(11, Math.min(16, width * 0.026))}px ${font}`;
        ctx.fillText(centerBottom, CX, CY + 20);
    }

    function hitTest(canvas, clientX, clientY) {
        const hit = canvas._hit;
        if (!hit) return -1;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left, y = clientY - rect.top;
        const r2 = Math.max(hit.dotR, 4) ** 2;
        let best = -1, bestD = Infinity;
        hit.pts.forEach((p, i) => {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (d <= r2 && d < bestD) { best = i; bestD = d; }
        });
        return best;
    }

    return { layout, draw, hitTest };
})();
