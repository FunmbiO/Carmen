import { REDUCE } from '../lib/util.js';

// Text and blocks rise into view the first time they scroll on screen. Plain CSS does the motion.
const done = new WeakSet();
let io = null;

function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { root: document.getElementById('views'), rootMargin: '0px 0px -10% 0px' });
  return io;
}

function reveal(els, kind) {
  if (REDUCE || !('IntersectionObserver' in window)) return;
  els.forEach((el) => {
    if (done.has(el)) return;
    done.add(el);
    el.classList.add('rv', kind);
    observer().observe(el);
  });
}

export const revealLines = (els) => reveal(els, 'rv-lines');
export const revealBlocks = (els) => reveal(els, 'rv-block');
