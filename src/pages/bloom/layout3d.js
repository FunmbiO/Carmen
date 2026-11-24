// Where each flower goes. Plain maths with no Three.js, so it can be checked in Node (dev/layout-check.mjs).
//
// The heads sit in a dome shell around a centre point. Each head is treated as a sphere, and the spheres are pushed
// apart until they only just touch, so neighbouring petals no longer pass through each other. Crowded flowers settle
// into a second layer instead of overlapping. If the whole set cannot fit, every flower is shrunk a little and the
// layout is run again.

export const DOME = { cx: 0, cy: -0.2, cz: 0, R0: 1.22, HMAX: 0.45, THMAX: 1.2 };
export const COLLIDE = 0.9; // the fraction of a head's reach that counts as solid; only the very tips of petals may meet
const GOLDEN = 2.39996323;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);

/** Pull a point back into the dome shell: not past the rim, and between the inner and outer surface. */
export function project(p, opts = {}) {
  const thMax = opts.thMax ?? DOME.THMAX, rMin = opts.rMin ?? DOME.R0, rMax = opts.rMax ?? DOME.R0 + DOME.HMAX;
  const v = sub(p, [DOME.cx, DOME.cy, DOME.cz]);
  let r = len(v) || 1e-6;
  let n = [v[0] / r, v[1] / r, v[2] / r];
  const th = Math.acos(Math.max(-1, Math.min(1, n[1])));
  if (th > thMax) {
    const h = Math.hypot(n[0], n[2]) || 1e-6;
    n = [(n[0] / h) * Math.sin(thMax), Math.cos(thMax), (n[2] / h) * Math.sin(thMax)];
  }
  r = Math.max(rMin, Math.min(rMax, r));
  return [DOME.cx + n[0] * r, DOME.cy + n[1] * r, DOME.cz + n[2] * r];
}

/** The direction a head at p should face: straight out from the dome centre. */
export function outward(p) {
  const v = sub(p, [DOME.cx, DOME.cy, DOME.cz]);
  const r = len(v) || 1;
  return [v[0] / r, v[1] / r, v[2] / r];
}

function worstOverlap(pos, rad) {
  let worst = 0;
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const min = rad[i] + rad[j];
      const d = len(sub(pos[i], pos[j]));
      if (d < min) worst = Math.max(worst, (min - d) / min);
    }
  }
  return worst;
}

/**
 * items: [{ reach, fixed?: [x,y,z] }]. The first item is the centrepiece and is fixed at the top of the dome.
 * Returns { positions, scale, overlap } where scale is how much every free flower had to shrink.
 */
export function planLayout(items, { seed = 7, maxOverlap = 0.1 } = {}) {
  const N = items.length;
  const top = [DOME.cx, DOME.cy + DOME.R0 + DOME.HMAX * 0.45, DOME.cz];
  let scale = 1;
  let pos = [];
  let rad = [];
  let overlap = 1;
  for (let attempt = 0; attempt < 9; attempt++) {
    const rand = rng(seed);
    rad = items.map((it) => it.reach * (it.fixed ? 1 : scale) * COLLIDE);
    pos = items.map((it, i) => {
      if (i === 0) return top.slice();
      if (it.fixed) return it.fixed.slice();
      // Start on a spiral over the dome, at slightly different heights.
      const th = DOME.THMAX * Math.sqrt((i + 0.5) / N) * 0.97;
      const ph = i * GOLDEN + rand() * 0.2;
      const r = DOME.R0 + DOME.HMAX * ((i * 0.37 + rand() * 0.2) % 1);
      return [DOME.cx + r * Math.sin(th) * Math.cos(ph), DOME.cy + r * Math.cos(th), DOME.cz + r * Math.sin(th) * Math.sin(ph)];
    });
    const frozen = items.map((it, i) => i === 0 || !!it.fixed);
    const ITER = 220;
    for (let it = 0; it < ITER; it++) {
      const step = 0.6 * (1 - it / ITER) + 0.06;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const d = sub(pos[i], pos[j]);
          let dist = len(d);
          const min = rad[i] + rad[j];
          if (dist >= min) continue;
          if (dist < 1e-6) { d[0] = rand() - 0.5; d[1] = rand() - 0.5; d[2] = rand() - 0.5; dist = len(d); }
          const push = (min - dist) * step;
          const share = frozen[i] || frozen[j] ? 1 : 0.5;
          const u = [d[0] / dist, d[1] / dist, d[2] / dist];
          if (!frozen[i]) for (let k = 0; k < 3; k++) pos[i][k] += u[k] * push * share;
          if (!frozen[j]) for (let k = 0; k < 3; k++) pos[j][k] -= u[k] * push * share;
        }
      }
      for (let i = 0; i < N; i++) if (!frozen[i]) pos[i] = project(pos[i]);
    }
    overlap = worstOverlap(pos, rad);
    if (overlap <= maxOverlap) break;
    scale *= 0.95;
  }
  return { positions: pos, scale, overlap, radii: rad };
}

/**
 * Find the roomiest spot for one more head, given the heads already placed ({ p, r } with r the solid radius).
 * Tries many random spots in the allowed band and keeps the one with the most clearance.
 */
export function placeNew(placed, reach, { thMin = 0, thMax = DOME.THMAX + 0.12, hMin = 0, hMax = DOME.HMAX + 0.6, tries = 700, seed = 1 } = {}) {
  const rand = rng(seed + placed.length * 131);
  const r = reach * COLLIDE;
  let best = null;
  let bestClear = -1e9;
  for (let k = 0; k < tries; k++) {
    const th = thMin + (thMax - thMin) * Math.sqrt(rand());
    const ph = rand() * Math.PI * 2;
    const rr = DOME.R0 + hMin + (hMax - hMin) * rand();
    const p = [DOME.cx + rr * Math.sin(th) * Math.cos(ph), DOME.cy + rr * Math.cos(th), DOME.cz + rr * Math.sin(th) * Math.sin(ph)];
    let clear = 1e9;
    for (const q of placed) clear = Math.min(clear, len(sub(p, q.p)) - (q.r + r));
    if (clear > bestClear) { bestClear = clear; best = p; }
  }
  return { p: best, r, clearance: bestClear };
}
