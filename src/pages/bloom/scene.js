import { palette } from '../../lib/theme.js';
import { mk, drawHead } from '../../lib/flowers.js';
import { bokeh, vignette, makeFlies, drawFlies } from '../../lib/ambience.js';
import { stemCurve, drawStem, drawLeaves, sway } from '../../lib/plant.js';
import { REDUCE, TAU, clamp, ease, rnd, fit, clock } from '../../lib/util.js';

// Scene I: a hero flower and a garden you can plant in.
export function createBloom(cv) {
  const S = { c: null, W: 0, H: 0, flowers: [], blades: [], flies: makeFlies(28), entered: false };

  function seed() {
    S.flowers = [mk({ fx: 0.5, fy: 0.4, bx: 0.5, s: 0.3, petals: 8, layers: 5, hue: 42, delay: 0.2, dur: 3.6, glyphs: 110, bend: 0.05, glow: true, hero: true, birth: 0 })];
    [[0.09, 0.62, 0.09, 6, 3, 22], [0.24, 0.76, 0.1, 7, 3, 55], [0.37, 0.84, 0.07, 5, 2, 95],
      [0.64, 0.82, 0.075, 6, 3, 30], [0.78, 0.72, 0.11, 9, 3, 15], [0.92, 0.6, 0.085, 5, 3, 48]].forEach((a, i) => {
      S.flowers.push(mk({ fx: a[0], fy: a[1], s: a[2], petals: a[3], layers: a[4], hue: a[5], bx: a[0] + rnd(-0.05, 0.05), bend: rnd(-0.07, 0.07), delay: 1.4 + i * 0.4, dur: 2.4, birth: 0 }));
    });
  }

  function plantDraw(f, now) {
    const { c, W, H } = S;
    const P = palette();
    const t = now - f.birth - f.delay;
    if (t <= 0) return;
    const p = REDUCE ? 1 : clamp(t / f.dur);
    const s = ease(clamp(p / 0.55)), b = clamp((p - 0.4) / 0.6);
    const size = f.s * W;
    const sw = sway(now, f.phase, size) * s;
    const bx = f.bx * W, by = H + 6, hx = f.fx * W + sw, hy = f.fy * H;
    const cx = (bx + hx) / 2 + f.bend * W + sw * 0.5, cy = (by + hy) / 2 + (by - hy) * 0.1;
    const pt = stemCurve(bx, by, hx, hy, cx, cy);
    drawStem(c, pt, s, Math.max(2, size * 0.035));
    drawLeaves(c, pt, s, [[0.35, 1], [0.58, -1]], size);
    c.fillStyle = `hsl(${P.hue(f.hue)},60%,${P.light ? 34 : 40}%)`;
    c.beginPath(); c.arc(hx, hy, size * 0.08 * s, 0, TAU); c.fill();
    drawHead(c, f, hx, hy, size, b, now);
  }

  function plant(fx, fy) {
    const pl = S.flowers.filter((f) => !f.hero);
    if (pl.length > 40) S.flowers.splice(S.flowers.indexOf(pl[0]), 1);
    fx = clamp(fx, 0.05, 0.95); fy = clamp(fy, 0.3, 0.86);
    const hues = [42, 30, 52, 22, 60, 36, 15, 48];
    S.flowers.push(mk({
      fx, fy, bx: fx + rnd(-0.06, 0.06), bend: rnd(-0.08, 0.08), s: rnd(0.07, 0.12),
      petals: Math.floor(rnd(5, 10)), layers: Math.floor(rnd(2, 4)), hue: hues[Math.floor(rnd(0, hues.length))],
      delay: 0, dur: 1.8, birth: clock(),
    }));
  }

  function replay() {
    const n = clock();
    S.flowers.forEach((f) => { f.birth = n; });
  }

  function resize() {
    const r = fit(cv, (w) => Math.round(clamp(w * 1.2, 480, 700)));
    if (!r) return;
    S.c = r.c; S.W = r.W; S.H = r.H;
    S.blades = Array.from({ length: 70 }, () => ({ x: rnd(0, 1), h: rnd(10, 34), ph: rnd(0, 6.28) }));
  }

  function draw(now, dt) {
    const { c, W, H } = S;
    if (!c) return;
    const P = palette();
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.bloomBg[0]); g.addColorStop(0.6, P.bloomBg[1]); g.addColorStop(1, P.bloomBg[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.62);
    glow.addColorStop(0, `rgba(${P.glow},${P.light ? 0.3 : 0.24})`); glow.addColorStop(1, `rgba(${P.glow},0)`);
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    const gr = c.createLinearGradient(0, H * 0.88, 0, H);
    gr.addColorStop(0, `rgba(${P.ground},0)`); gr.addColorStop(1, `rgba(${P.ground},0.85)`);
    c.fillStyle = gr; c.fillRect(0, H * 0.88, W, H * 0.12);
    bokeh(c, W, H, now);
    drawFlies(c, W, H, now, dt, S.flies, 1);
    c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = P.blade;
    c.beginPath();
    S.blades.forEach((b) => {
      const x = b.x * W, sw = REDUCE ? 0 : Math.sin(now * 1.1 + b.ph) * 4;
      c.moveTo(x, H); c.quadraticCurveTo(x + sw * 0.4, H - b.h * 0.6, x + sw, H - b.h);
    });
    c.stroke();
    S.flowers.slice().sort((a, b) => a.s - b.s).forEach((f) => plantDraw(f, now));
    vignette(c, W, H);
  }

  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect();
    plant((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  seed();
  return {
    scene: {
      enter() {
        resize();
        // The first visit starts the growth fresh, so it isn't finished before she sees it.
        if (!S.entered) { S.entered = true; replay(); }
      },
      leave() {},
      resize,
      draw,
    },
    plant: () => plant(rnd(0.08, 0.92), rnd(0.55, 0.82)),
    replay,
  };
}
