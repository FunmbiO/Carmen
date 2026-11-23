import { palette } from './theme.js';
import { REDUCE, TAU, GLYPHS, GOLDEN, clamp, ease, rnd } from './util.js';

// The code flower: layered petals around a phyllotaxis of glyphs. Colours come from the active theme.

export function petalPath(c, L, Wd, pt) {
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(Wd * 0.95, -L * 0.22, Wd * (0.75 - 0.55 * pt), -L * 0.88, 0, -L);
  c.bezierCurveTo(-Wd * (0.75 - 0.55 * pt), -L * 0.88, -Wd * 0.95, -L * 0.22, 0, 0);
  c.closePath();
}

export function leaf(c, x, y, rot, L, g) {
  if (g <= 0) return;
  const P = palette();
  const wl = L * 0.28;
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(g, g);
  c.fillStyle = `hsla(${P.leaf[0]},${P.leaf[1]}%,${P.leaf[2]}%,0.95)`;
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(wl, -L * 0.25, wl * 0.8, -L * 0.75, 0, -L);
  c.bezierCurveTo(-wl * 0.8, -L * 0.75, -wl, -L * 0.25, 0, 0);
  c.fill();
  c.restore();
}

/** Flower spec with defaults. */
export function mk(o) {
  return {
    petals: 6, layers: 3, hue: 42, sat: 90, dl: 0, w: 0.4, pt: 0, drop: 0.17, glyphs: 36, cs: 1,
    glow: false, rot: rnd(0, 6.28), phase: rnd(0, 6.28), ...o,
  };
}

export function drawHead(c, f, hx, hy, size, b, now) {
  if (b <= 0) return;
  const P = palette();
  const DL = f.dl + P.dl;
  const SAT = Math.min(100, f.sat * P.sat);
  c.save();
  c.translate(hx, hy);
  const spin = REDUCE ? f.rot : now * 0.04 + f.rot;
  for (let l = 0; l < f.layers; l++) {
    const o = ease(clamp(b * 1.7 - l * 0.2));
    if (o <= 0) continue;
    const L = size * (1 - l * f.drop), Wd = L * f.w;
    const off = l * Math.PI / f.petals + l * 0.18;
    const hh = P.hue(f.hue + l * 5);
    const gr = c.createLinearGradient(0, 0, 0, -L);
    gr.addColorStop(0, `hsl(${hh},${SAT * 0.9}%,${30 + DL * 0.3}%)`);
    gr.addColorStop(0.55, `hsl(${hh + 8},${SAT}%,${56 + DL * 0.7}%)`);
    gr.addColorStop(1, `hsl(${hh + 16},${Math.min(100, SAT + 8)}%,${Math.min(90, 78 + DL * 0.4)}%)`);
    c.fillStyle = gr;
    c.strokeStyle = P.light ? `hsla(${hh},60%,22%,0.35)` : `hsla(${hh + 12},100%,90%,0.5)`;
    c.lineWidth = 1;
    if (f.glow && l === 0) { c.shadowColor = `rgba(${P.glow},0.6)`; c.shadowBlur = size * 0.25; }
    else { c.shadowBlur = 0; c.shadowColor = 'transparent'; }
    for (let i = 0; i < f.petals; i++) {
      c.save();
      c.rotate(spin + off + (i * TAU) / f.petals);
      c.scale(0.5 + 0.5 * o, o);
      petalPath(c, L, Wd, f.pt);
      c.fill(); c.stroke();
      c.restore();
    }
  }
  c.shadowBlur = 0; c.shadowColor = 'transparent';
  const cr = size * 0.3 * f.cs;
  const rg = c.createRadialGradient(0, 0, 0, 0, 0, cr);
  rg.addColorStop(0, `rgba(${P.core},0.55)`);
  rg.addColorStop(1, `rgba(${P.core},0)`);
  c.fillStyle = rg;
  c.beginPath(); c.arc(0, 0, cr, 0, TAU); c.fill();
  const n = Math.floor(f.glyphs * ease(clamp((b - 0.3) / 0.7)));
  const fs = Math.max(6, size * 0.07);
  const sp = size * 0.0238 * f.cs;
  c.font = `${fs}px "DM Mono", monospace`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let j = 1; j <= n; j++) {
    const r = sp * Math.sqrt(j);
    const ang = j * GOLDEN + (REDUCE ? 0 : now * 0.08);
    c.fillStyle = `hsla(${P.glyph[0]},100%,${P.glyph[1] + (j % 5) * 4}%,${(0.95 - (j / (n + 40)) * 0.35).toFixed(2)})`;
    c.fillText(GLYPHS[j % GLYPHS.length], r * Math.cos(ang), r * Math.sin(ang));
  }
  c.restore();
}
