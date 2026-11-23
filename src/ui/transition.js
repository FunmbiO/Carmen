import { gsap } from 'gsap';
import { REDUCE } from '../lib/util.js';

// On every page change: the page eases in and a gold line sweeps under the top bar.
export function playPageTransition() {
  if (REDUCE) return;
  const inner = document.getElementById('views-inner');
  const line = document.querySelector('.route-line');
  gsap.fromTo(inner, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' });
  if (line) {
    gsap.fromTo(line, { scaleX: 0, transformOrigin: 'left center', opacity: 1 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' });
    gsap.to(line, { opacity: 0, duration: 0.5, delay: 0.8 });
  }
}
