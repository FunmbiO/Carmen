export const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TAU = Math.PI * 2;
export const GLYPHS = '01{}<>/;=*'.split('');
export const GOLDEN = 2.39996323;

const T0 = performance.now();
export const clock = () => (performance.now() - T0) / 1000;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => 1 - Math.pow(1 - t, 3);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const $ = (id) => document.getElementById(id);

/** Size a canvas to its parent at up to 2x pixel density. Returns a drawing context and CSS size. */
export function fit(cv, heightFor) {
  const w = cv.parentElement.clientWidth;
  if (!w) return null;
  const h = heightFor(w);
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * d);
  cv.height = Math.round(h * d);
  cv.style.height = h + 'px';
  const c = cv.getContext('2d');
  c.setTransform(d, 0, 0, d, 0, 0);
  return { c, W: w, H: h };
}
