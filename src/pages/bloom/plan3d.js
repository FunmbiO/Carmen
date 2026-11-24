import { COLOR_ORDER } from './colors3d.js';
import { DOME } from './layout3d.js';

// What goes in the bouquet. Pure data and no Three.js, so the layout can be checked in Node.

export const START_FLOWERS = 26;
export const MAX_FLOWERS = 40;

// Roses are about half the bouquet.
const TYPES = ['rose', 'peony', 'rose', 'daisy', 'rose', 'tulip', 'rose', 'sunflower', 'rose', 'daisy', 'rose', 'peony', 'rose', 'tulip'];
// Rose colours: classic reds and pinks first, with a blush, a peach and a yellow among them.
const ROSE_COLORS = ['crimson', 'hotpink', 'blush', 'coral', 'wine', 'crimson', 'peach', 'hotpink', 'sun', 'coral'];
// The size each kind is drawn at, and how far its petals reach from the centre of the head at size 1.
export const SIZE = { rose: 1.0, peony: 1.2, daisy: 0.9, tulip: 0.95, sunflower: 1.0 };
export const REACH = { rose: 0.42, peony: 0.48, daisy: 0.42, tulip: 0.3, sunflower: 0.5 };

export function specAt(i) {
  const type = i === 0 ? 'peony' : TYPES[(i * 3 + Math.floor(i / 4)) % TYPES.length];
  let color = COLOR_ORDER[(i * 7) % COLOR_ORDER.length];
  if (i === 0) color = 'blush';
  if (type === 'sunflower') color = 'sun';
  if (type === 'rose') color = ROSE_COLORS[(i * 3) % ROSE_COLORS.length];
  const size = SIZE[type] * (i === 0 ? 1.2 : 1) * (0.95 + ((i * 37) % 10) / 100);
  return { type, color, size, reach: REACH[type] * size };
}

/** Hydrangea clusters sit low around the rim. They are obstacles the flowers are laid out around. */
export function hydrangeaSlots() {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const ph = 0.9 + (k / 3) * Math.PI * 2, th = 1.27, r = DOME.R0;
    out.push([DOME.cx + r * Math.sin(th) * Math.cos(ph), DOME.cy + r * Math.cos(th), DOME.cz + r * Math.sin(th) * Math.sin(ph)]);
  }
  return out;
}
