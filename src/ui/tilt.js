import VanillaTilt from 'vanilla-tilt';
import { REDUCE } from '../lib/util.js';

// A light 3D lean on feature panels. Skipped for reduced motion and on touch screens.
export function mountTilt(root = document) {
  if (REDUCE || window.matchMedia('(hover: none)').matches) return;
  const els = root.querySelectorAll('.tilt:not([data-tilted])');
  els.forEach((el) => el.setAttribute('data-tilted', ''));
  VanillaTilt.init(els, { max: 3.5, speed: 600, perspective: 1100, scale: 1.01, glare: false });
}
