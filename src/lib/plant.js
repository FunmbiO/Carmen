import { palette } from './theme.js';
import { leaf } from './flowers.js';
import { REDUCE, ease, clamp } from './util.js';

// A stem is a quadratic curve from a base to a head, with leaves along it.

export function stemCurve(bx, by, hx, hy, cx, cy) {
  return (u) => {
    const m = 1 - u;
    return [m * m * bx + 2 * m * u * cx + u * u * hx, m * m * by + 2 * m * u * cy + u * u * hy];
  };
}

/** Draw the grown part of a stem (0..1) and return the point at its tip. */
export function drawStem(c, pt, grown, width, color) {
  c.lineCap = 'round';
  c.strokeStyle = color || palette().stem;
  c.lineWidth = width;
  c.beginPath();
  for (let k = 0; k <= 24; k++) {
    const q = pt((grown * k) / 24);
    if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]);
  }
  c.stroke();
  return pt(grown);
}

export function drawLeaves(c, pt, grown, specs, size) {
  specs.forEach(([at, dir]) => {
    const g = ease(clamp((grown - at) / 0.25));
    const p = pt(at);
    leaf(c, p[0], p[1], dir * 1.05, size * 0.55, g);
  });
}

/** Sway offset shared by the scenes. */
export const sway = (now, phase, size, k = 0.06) => (REDUCE ? 0 : Math.sin(now * 0.9 + phase) * size * k);
