import { REDUCE } from '../lib/util.js';

// Text and blocks rise into view the first time they scroll on screen. Plain CSS does the motion.
const done = new WeakSet();
let io = null;
const pending = new Set();
let sweeping = false;

function show(el) {
  el.classList.add('is-in');
  pending.delete(el);
  if (io) io.unobserve(el);
}

// A quick jump down the page skips straight past some blocks without them ever crossing the edge, so sweep for those on scroll.
function sweep() {
  sweeping = false;
  const top = document.getElementById('views').getBoundingClientRect().top;
  pending.forEach((el) => { if (el.getBoundingClientRect().bottom < top) show(el); });
}

function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      show(e.target);
    });
  }, { root: document.getElementById('views'), rootMargin: '0px 0px -10% 0px' });
  document.getElementById('views').addEventListener('scroll', () => {
    if (!pending.size || sweeping) return;
    sweeping = true;
    requestAnimationFrame(sweep);
  }, { passive: true });
  return io;
}

function reveal(els, kind) {
  if (REDUCE || !('IntersectionObserver' in window)) return;
  els.forEach((el) => {
    if (done.has(el)) return;
    done.add(el);
    el.classList.add('rv', kind);
    pending.add(el);
    observer().observe(el);
  });
}

export const revealLines = (els) => reveal(els, 'rv-lines');
export const revealBlocks = (els) => reveal(els, 'rv-block');
