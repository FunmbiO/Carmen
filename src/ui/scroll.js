import Lenis from 'lenis';
import { REDUCE } from '../lib/util.js';

// Smooth, weighty scrolling inside the page container.
let lenis = null;

export function startScroll() {
  if (REDUCE) return null;
  const wrapper = document.getElementById('views');
  const content = document.getElementById('views-inner');
  lenis = new Lenis({ wrapper, content, duration: 1.15, smoothWheel: true, easing: (t) => 1 - Math.pow(1 - t, 3.2) });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}

export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else document.getElementById('views').scrollTop = 0;
}
