import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCE } from '../lib/util.js';

// Smooth, weighty scrolling inside the page container.
let lenis = null;

export function startScroll() {
  // Touch screens already scroll smoothly, and the engine would only add a frame loop and extra work.
  if (REDUCE || window.matchMedia('(pointer: coarse)').matches) return null;
  const wrapper = document.getElementById('views');
  const content = document.getElementById('views-inner');
  lenis = new Lenis({ wrapper, content, duration: 1.15, smoothWheel: true, easing: (t) => 1 - Math.pow(1 - t, 3.2) });
  lenis.on('scroll', ScrollTrigger.update); // keep reveals in step with the smooth scroll
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}

export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else document.getElementById('views').scrollTop = 0;
}

/** Smoothly scroll the page container to a position. */
export function scrollToY(y) {
  const views = document.getElementById('views');
  if (lenis) lenis.scrollTo(y);
  else views.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
}

/** Scroll so the bottom edge of an element sits just under the top bar. */
export function scrollPast(el, gap = 14) {
  const views = document.getElementById('views');
  const y = views.scrollTop + el.getBoundingClientRect().bottom - views.getBoundingClientRect().top - gap;
  scrollToY(Math.max(0, y));
}
