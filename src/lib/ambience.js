import { palette } from './theme.js';
import { REDUCE, TAU, rnd } from './util.js';

// Soft light layers shared by the canvas scenes.

const BOK = Array.from({ length: 9 }, () => ({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0.05, 0.16), ph: rnd(0, 6.28), sp: rnd(0.05, 0.15) }));

export function bokeh(c, W, H, now) {
  const P = palette();
  BOK.forEach((b) => {
    const x = (b.x + (REDUCE ? 0 : Math.sin(now * b.sp + b.ph) * 0.03)) * W;
    const y = (b.y + (REDUCE ? 0 : Math.cos(now * b.sp * 0.8 + b.ph) * 0.03)) * H;
    const r = b.r * W;
    const a = P.light ? 0.16 : 0.11;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${P.bokeh},${a})`);
    g.addColorStop(0.7, `rgba(${P.bokeh},${a * 0.45})`);
    g.addColorStop(1, `rgba(${P.bokeh},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  });
}

export function vignette(c, W, H) {
  const P = palette();
  const g = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  g.addColorStop(0, `rgba(${P.vig},0)`);
  g.addColorStop(1, `rgba(${P.vig},${P.light ? 0.22 : 0.62})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

export function makeFlies(n) {
  return Array.from({ length: n }, () => ({ x: rnd(0, 1), y: rnd(0.05, 0.95), vx: rnd(-0.01, 0.01), vy: rnd(-0.012, -0.002), ph: rnd(0, 6.28), r: rnd(1, 2.2) }));
}

export function drawFlies(c, W, H, now, dt, flies, k) {
  const P = palette();
  for (const f of flies) {
    if (!REDUCE) {
      f.x += f.vx * dt + Math.sin(now * 0.7 + f.ph) * 0.0006;
      f.y += f.vy * dt;
      if (f.y < -0.03) { f.y = 1.03; f.x = rnd(0, 1); }
      if (f.x < -0.03) f.x = 1.03;
      if (f.x > 1.03) f.x = -0.03;
    }
    const a = (0.35 + 0.65 * Math.abs(Math.sin(now * 1.3 + f.ph))) * k;
    const x = f.x * W, y = f.y * H;
    c.fillStyle = `rgba(${P.fly},${(a * 0.14).toFixed(3)})`;
    c.beginPath(); c.arc(x, y, f.r * 4, 0, TAU); c.fill();
    c.fillStyle = `rgba(${P.fly},${a.toFixed(3)})`;
    c.beginPath(); c.arc(x, y, f.r, 0, TAU); c.fill();
  }
}
