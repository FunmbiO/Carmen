import { palette } from '../../lib/theme.js';
import { drawHead } from '../../lib/flowers.js';
import { bokeh, vignette, makeFlies, drawFlies } from '../../lib/ambience.js';
import { stemCurve, drawStem } from '../../lib/plant.js';
import { leaf } from '../../lib/flowers.js';
import { REDUCE, TAU, GLYPHS, clamp, ease, rnd, fit } from '../../lib/util.js';
import { $ } from '../../lib/util.js';
import { goldBurst } from '../../ui/confetti.js';
import { watchVisible } from '../../lib/visible.js';
import { QUALITIES as Q } from './data.js';

// Scene II: a bouquet of seven flowers. Tap one to read it.
export function createBouquet(cv) {
  const S = { c: null, W: 0, H: 0, t0: null, sel: -1, found: 0, parts: [], flies: makeFlies(18), geo: [] };

  function buildChips() {
    const box = $('chips');
    box.innerHTML = '';
    Q.forEach((q, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.id = 'chip' + i; b.textContent = q.fn;
      b.addEventListener('click', () => select(i));
      box.appendChild(b);
    });
  }

  function burst(x, y, n) {
    const P = palette();
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(30, 110);
      S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(1, 1.8), ch: GLYPHS[Math.floor(rnd(0, GLYPHS.length))], hue: Math.random() < 0.5 ? P.glyph[0] : P.leaf[0] });
    }
  }

  function select(i) {
    const q = Q[i];
    S.sel = i; q.tap = performance.now() / 1000;
    if (!q.found) { q.found = true; S.found++; }
    const g = S.geo[i];
    if (g) burst(g.x, g.y, 14);
    $('qFn').textContent = '// ' + q.fn;
    $('qTitle').textContent = q.title;
    $('qLine').textContent = q.line;
    $('qCode').textContent = q.code;
    $('qProg').textContent = S.found + ' of 7 found';
    $('qBar').style.width = Math.round((S.found / Q.length) * 100) + '%';
    Q.forEach((qq, j) => { $('chip' + j).className = 'chip' + (qq.found ? ' found' : '') + (j === i ? ' sel' : ''); });
    if (S.found === Q.length && $('qDone').hidden) {
      $('qDone').hidden = false;
      if (g) burst(g.x, g.y, 30);
      goldBurst({ x: 0.5, y: 0.55 });
    }
  }

  function resize() {
    const r = fit(cv, (w) => Math.round(clamp(w * 1.18, 460, 660)));
    if (!r) return;
    S.c = r.c; S.W = r.W; S.H = r.H;
  }

  function bow(c, W, H) {
    const P = palette();
    const xc = W * 0.5, y = H * 0.8;
    const gr = c.createLinearGradient(0, y - 6, 0, y + 12);
    gr.addColorStop(0, P.ribbon[0]); gr.addColorStop(1, P.ribbon[1]);
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(xc - W * 0.17, y - 4);
    c.quadraticCurveTo(xc, y + 8, xc + W * 0.17, y - 4);
    c.lineTo(xc + W * 0.17, y + 8);
    c.quadraticCurveTo(xc, y + 20, xc - W * 0.17, y + 8);
    c.closePath(); c.fill();
    const yb = y + 8;
    c.fillStyle = P.ribbon[2];
    [-1, 1].forEach((d) => {
      c.beginPath();
      c.moveTo(xc, yb);
      c.bezierCurveTo(xc + d * 36, yb - 30, xc + d * 50, yb + 8, xc, yb);
      c.fill();
    });
    c.strokeStyle = P.ribbon[0]; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(xc - 2, yb); c.quadraticCurveTo(xc - 14, yb + 22, xc - 22, yb + 40); c.stroke();
    c.beginPath(); c.moveTo(xc + 2, yb); c.quadraticCurveTo(xc + 16, yb + 20, xc + 24, yb + 34); c.stroke();
    c.fillStyle = P.ribbon[0];
    c.beginPath(); c.arc(xc, yb, 6, 0, TAU); c.fill();
  }

  function draw(now, dt) {
    const { c, W, H } = S;
    if (!c) return;
    const P = palette();
    if (S.t0 === null) S.t0 = now;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.bqBg[0]); g.addColorStop(1, P.bqBg[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.7);
    glow.addColorStop(0, `rgba(${P.glow},${P.light ? 0.28 : 0.2})`); glow.addColorStop(1, `rgba(${P.glow},0)`);
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    bokeh(c, W, H, now);
    drawFlies(c, W, H, now, dt, S.flies, 1);

    const bx = W * 0.5, by = H * 1.02;
    const st = Q.map((q, i) => {
      const t = now - S.t0 - 0.2 - i * 0.28;
      const p = REDUCE ? 1 : clamp(t / 2.4);
      return { s: ease(clamp(p / 0.5)), b: clamp((p - 0.35) / 0.65) };
    });
    const heads = [];
    Q.forEach((q, i) => {
      const size = q.s * W, sway = REDUCE ? 0 : Math.sin(now * 0.8 + q.f.phase) * size * 0.05;
      const hxF = q.hx * W + sway, hyF = q.hy * H;
      const cx = bx + (hxF - bx) * 0.12, cy = by + (hyF - by) * 0.55;
      const pt = stemCurve(bx, by, hxF, hyF, cx, cy);
      const tip = drawStem(c, pt, st[i].s, 3.2);
      if (i > 0 && i < 6) {
        const lp = pt(0.55);
        leaf(c, lp[0], lp[1], (i % 2 ? 1 : -1) * 1.1, W * 0.2, ease(clamp((st[i].s - 0.5) / 0.4)));
      }
      heads.push({ i, x: tip[0], y: tip[1], size });
      S.geo[i] = { x: hxF, y: hyF, r: size * 0.95 };
    });

    heads.slice().sort((a, b) => Q[a.i].hy - Q[b.i].hy).forEach((h) => {
      const q = Q[h.i];
      let size = h.size;
      const tt = q.tap === undefined ? 9 : now - q.tap;
      if (tt < 0.7 && !REDUCE) size *= 1 + 0.12 * Math.sin((tt / 0.7) * Math.PI);
      if (S.sel === h.i) {
        const gl = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, size * 1.5);
        gl.addColorStop(0, `rgba(${P.glow},0.3)`); gl.addColorStop(1, `rgba(${P.glow},0)`);
        c.fillStyle = gl; c.beginPath(); c.arc(h.x, h.y, size * 1.5, 0, TAU); c.fill();
      }
      drawHead(c, q.f, h.x, h.y, size, st[h.i].b, now);
      if (tt < 1.2 && !REDUCE) {
        c.strokeStyle = `rgba(${P.glow},${(0.7 * (1 - tt / 1.2)).toFixed(2)})`;
        c.lineWidth = 2;
        c.beginPath(); c.arc(h.x, h.y, size * (1 + tt * 1.3), 0, TAU); c.stroke();
      }
    });

    // brown paper cone
    const pg = c.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
    pg.addColorStop(0, 'hsl(28,40%,17%)'); pg.addColorStop(0.5, 'hsl(28,45%,31%)'); pg.addColorStop(1, 'hsl(28,40%,15%)');
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(W * 0.31, H * 0.74);
    c.quadraticCurveTo(W * 0.5, H * 0.71, W * 0.69, H * 0.74);
    c.lineTo(W * 0.545, H + 2); c.lineTo(W * 0.455, H + 2);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,220,160,0.14)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(W * 0.42, H * 0.73); c.lineTo(W * 0.48, H); c.moveTo(W * 0.58, H * 0.73); c.lineTo(W * 0.52, H); c.stroke();
    bow(c, W, H);
    vignette(c, W, H);

    // The name tag above the chosen flower is a square label.
    if (S.sel >= 0 && S.geo[S.sel]) {
      const q2 = Q[S.sel], g2 = S.geo[S.sel];
      c.font = '12px "DM Mono", monospace';
      const tw = c.measureText(q2.fn).width + 18;
      const lx = clamp(g2.x - tw / 2, 6, W - tw - 6), ly = Math.max(8, g2.y - g2.r * 1.15 - 26);
      c.fillStyle = P.light ? 'rgba(246,239,227,0.92)' : 'rgba(10,10,8,0.85)';
      c.strokeStyle = P.light ? '#5a1624' : '#e7c26a'; c.lineWidth = 1;
      c.fillRect(lx, ly, tw, 24); c.strokeRect(lx + 0.5, ly + 0.5, tw - 1, 23);
      c.fillStyle = P.light ? '#5a1624' : '#fff0b8'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(q2.fn, lx + tw / 2, ly + 12);
    }

    for (let i2 = S.parts.length - 1; i2 >= 0; i2--) {
      const p = S.parts[i2];
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 20 * dt;
      if (p.life > p.max) { S.parts.splice(i2, 1); continue; }
      c.fillStyle = `hsla(${p.hue},100%,${P.light ? 32 : 70}%,${(1 - p.life / p.max).toFixed(2)})`;
      c.font = '14px "DM Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.ch, p.x, p.y);
    }
  }

  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const order = Q.map((q, i) => i).sort((a, b) => Q[b].hy - Q[a].hy);
    for (let k = 0; k < order.length; k++) {
      const g = S.geo[order[k]];
      if (g && Math.hypot(x - g.x, y - g.y) < g.r) { select(order[k]); return; }
    }
  });

  buildChips();
  const visible = watchVisible(cv);
  return { enter() { resize(); }, leave() {}, resize, draw, visible, maxFps: 30 };
}
