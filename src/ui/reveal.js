import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { REDUCE } from '../lib/util.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const SCROLLER = '#views';
const done = new WeakSet();

/** Lines of text rise out of a mask as they scroll into view. */
export async function revealLines(els) {
  if (REDUCE) return;
  try { await document.fonts.ready; } catch { /* fonts API missing */ }
  els.forEach((el) => {
    if (done.has(el)) return;
    done.add(el);
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 105, duration: 1.1, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: el, scroller: SCROLLER, start: 'top 88%', once: true },
    });
  });
  ScrollTrigger.refresh();
}

/** Blocks fade up as they scroll into view. */
export function revealBlocks(els) {
  if (REDUCE) return;
  els.forEach((el) => {
    if (done.has(el)) return;
    done.add(el);
    gsap.from(el, {
      opacity: 0, y: 24, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, scroller: SCROLLER, start: 'top 90%', once: true },
    });
  });
  ScrollTrigger.refresh();
}

export { ScrollTrigger };
