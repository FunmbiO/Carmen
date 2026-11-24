import { drawFlies, makeFlies } from '../../lib/ambience.js';
import { watchVisible } from '../../lib/visible.js';
import { REDUCE, TAU, clamp, rnd, fit, $ } from '../../lib/util.js';
import { SKY, STAGES } from './data.js';

// Scene III: drag the sun from gold to night.
export function createGolden(cv) {
  const S = { c: null, W: 0, H: 0, t: 0.22, stage: -1, stars: [], stalks: [], flies: makeFlies(22), down: false, active: false, px: 0.5, pxS: 0.5 };

  const rgb = (a, b, k) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
  function sky(t) {
    for (let i = 0; i < SKY.length - 1; i++) {
      if (t <= SKY[i + 1].t) {
        const k = (t - SKY[i].t) / (SKY[i + 1].t - SKY[i].t);
        return SKY[i].c.map((a, j) => rgb(a, SKY[i + 1].c[j], k));
      }
    }
    return ['#07100b', '#0f1c13', '#243014'];
  }
  function hill(c, W, H, base, amp, f1, p1, f2, p2, col) {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) c.lineTo(x, base + amp * Math.sin((x / W) * f1 + p1) + amp * 0.5 * Math.sin((x / W) * f2 + p2));
    c.lineTo(W, H); c.closePath(); c.fill();
  }

  function setT(t) {
    S.t = clamp(t);
    $('gSlider').value = Math.round(S.t * 100);
    let idx = 0;
    while (idx < STAGES.length - 1 && S.t > STAGES[idx].max) idx++;
    if (idx !== S.stage) {
      S.stage = idx;
      $('gWord').textContent = STAGES[idx].w;
      $('gLine').textContent = STAGES[idx].l;
    }
  }

  function resize() {
    const r = fit(cv, (w) => Math.round(clamp(w, 380, 560)));
    if (!r) return;
    S.c = r.c; S.W = r.W; S.H = r.H;
    S.stars = Array.from({ length: 46 }, () => ({ x: rnd(0, 1), y: rnd(0.03, 0.5), ch: Math.random() < 0.5 ? '0' : '1', ph: rnd(0, 6.28) }));
    S.stalks = Array.from({ length: 70 }, () => ({ x: rnd(0, 1), h: rnd(40, 120), ph: rnd(0, 6.28) }));
  }

  function draw(now, dt) {
    const { c, W, H } = S;
    const t = S.t;
    if (!c) return;
    S.pxS += (S.px - S.pxS) * Math.min(1, dt * 3); // eased pointer for the parallax
    const par = REDUCE ? 0 : (S.pxS - 0.5);
    const sk = sky(t);
    const g = c.createLinearGradient(0, 0, 0, H * 0.78);
    g.addColorStop(0, sk[0]); g.addColorStop(0.55, sk[1]); g.addColorStop(1, sk[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    if (t > 0.6) {
      const sa = (t - 0.6) / 0.4;
      c.font = '11px "DM Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      S.stars.forEach((s) => {
        const tw = REDUCE ? 1 : 0.55 + 0.45 * Math.sin(now * 1.4 + s.ph);
        c.fillStyle = `rgba(255,230,170,${(sa * 0.85 * tw).toFixed(2)})`;
        c.fillText(s.ch, s.x * W - par * 6, s.y * H);
      });
    }

    const sx = W * (0.62 - 0.24 * t), sy = H * (0.28 + 0.52 * t), sr = W * 0.085;
    const sc = Math.min(1, t * 1.6);
    const sunCol = `rgb(255,${Math.round(236 - 96 * sc)},${Math.round(170 - 110 * sc)})`;
    const halo = c.createRadialGradient(sx, sy, sr * 0.4, sx, sy, W * 0.5);
    halo.addColorStop(0, `rgba(255,${Math.round(200 - 60 * sc)},90,${(0.55 * (1 - t * 0.5)).toFixed(2)})`);
    halo.addColorStop(1, 'rgba(255,160,60,0)');
    c.fillStyle = halo; c.fillRect(0, 0, W, H);
    c.fillStyle = sunCol; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();

    // Three hill layers drift against each other as the pointer moves.
    const d = 1 - t * 0.7;
    hill(c, W, H, H * 0.7, H * 0.03, 5, 0.4 + par * 0.5, 11, 1.3, `hsl(60,30%,${(30 * (1 - t * 0.75)).toFixed(1)}%)`);
    hill(c, W, H, H * 0.78, H * 0.035, 4, 2.2 + par * 1.0, 9, 0.2, `hsl(95,28%,${(22 * d).toFixed(1)}%)`);
    hill(c, W, H, H * 0.88, H * 0.02, 3, 4.1 + par * 1.6, 8, 2.6, `hsl(120,25%,${(13 * (1 - t * 0.55)).toFixed(1)}%)`);

    drawFlies(c, W, H, now, dt, S.flies, clamp((t - 0.4) / 0.4));

    c.lineCap = 'round';
    S.stalks.forEach((s) => {
      const x = s.x * W, sw = REDUCE ? 0 : Math.sin(now * 1.2 + s.ph) * 6 + par * 8;
      c.strokeStyle = `hsl(60,35%,${(24 * (1 - t * 0.6) + 5).toFixed(1)}%)`;
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + sw * 0.3, H - s.h * 0.6, x + sw, H - s.h); c.stroke();
      c.fillStyle = `hsla(45,90%,70%,${(0.9 * (1 - t * 0.7)).toFixed(2)})`;
      c.beginPath(); c.arc(x + sw, H - s.h, 2.4, 0, TAU); c.fill();
    });
  }

  const pointer = (e) => {
    const r = cv.getBoundingClientRect();
    setT((e.clientX - r.left) / r.width);
  };
  cv.addEventListener('pointerdown', (e) => {
    S.down = true;
    try { cv.setPointerCapture(e.pointerId); } catch { /* not capturable */ } // keep the drag even if the finger slips off
    pointer(e);
  });
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    S.px = clamp((e.clientX - r.left) / r.width);
    if (S.down) pointer(e);
  });
  const release = () => { S.down = false; };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  $('gSlider').addEventListener('input', (e) => setT(e.target.value / 100));
  setT(0.22);

  return {
    enter() { S.active = true; resize(); },
    leave() { S.active = false; },
    resize,
    draw,
    visible: watchVisible(cv),
    maxFps: 30,
  };
}
