import { palette } from '../../lib/theme.js';
import { REDUCE, GLYPHS, clamp, rnd, fit } from '../../lib/util.js';
import { watchVisible } from '../../lib/visible.js';

// Scene IV: code falling like rain. Pointer or tap makes the nearby columns rush.
export function createRain(cv) {
  const S = { c: null, W: 0, H: 0, cols: [] };
  const CW = 16;

  const pickHue = () => {
    const [a, b] = palette().rain;
    const r = Math.random() < 0.55 ? a : b;
    return rnd(r[0], r[1]);
  };

  function resize() {
    const r = fit(cv, (w) => Math.round(clamp(w * 0.62, 220, 320)));
    if (!r) return;
    S.c = r.c; S.W = r.W; S.H = r.H;
    S.c.fillStyle = '#0c0905'; S.c.fillRect(0, 0, S.W, S.H);
    S.cols = Array.from({ length: Math.ceil(S.W / CW) }, () => ({ y: rnd(-S.H, S.H), v: rnd(40, 110), hue: pickHue(), boost: 0 }));
    if (REDUCE) for (let k = 0; k < 140; k++) step(0.03);
  }

  function step(dt) {
    const c = S.c;
    c.fillStyle = 'rgba(12,9,5,0.16)';
    c.fillRect(0, 0, S.W, S.H);
    c.font = '14px "DM Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    S.cols.forEach((col, i) => {
      col.y += col.v * dt * (1 + col.boost * 2.5);
      col.boost = Math.max(0, col.boost - dt * 1.1);
      if (col.y > S.H + 20) { col.y = rnd(-120, 0); col.v = rnd(40, 110); col.hue = pickHue(); }
      c.fillStyle = `hsla(${col.hue},90%,${62 + col.boost * 20}%,${(0.75 + col.boost * 0.25).toFixed(2)})`;
      c.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * CW + CW / 2, col.y);
    });
  }

  const hit = (x) => S.cols.forEach((col, i) => { if (Math.abs(i * CW + CW / 2 - x) < 70) col.boost = 1; });
  cv.addEventListener('pointerdown', (e) => hit(e.clientX - cv.getBoundingClientRect().left));
  cv.addEventListener('pointermove', (e) => { if (e.buttons) hit(e.clientX - cv.getBoundingClientRect().left); });

  return {
    scene: {
      enter: resize, leave() {}, resize,
      draw(now, dt) { if (S.c && !REDUCE) step(dt); },
      visible: watchVisible(cv),
      maxFps: 30,
    },
    rush: () => S.cols.forEach((col) => { col.boost = 1; }),
  };
}
