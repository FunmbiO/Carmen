import { mk } from '../../lib/flowers.js';

// Seven flowers, each one a quality and a line of code.
export const QUALITIES = [
  { fn: 'grace()', title: 'Grace', line: "Even just through a screen I can feel your essence. You carry yourself with elegance, and a glow that leaves an impression.", code: 'return calm * confidence;',
    hx: 0.5, hy: 0.17, s: 0.13, f: mk({ petals: 6, layers: 2, hue: 42, w: 0.28, pt: 0.8, glyphs: 20, drop: 0.2 }) },
  { fn: 'class()', title: 'Class', line: "Honestly, self-explanatory. You're a very classy lady.", code: 'return luxury - noise;',
    hx: 0.27, hy: 0.25, s: 0.115, f: mk({ petals: 7, layers: 5, hue: 28, w: 0.45, glyphs: 26, drop: 0.16 }) },
  { fn: 'warmth()', title: 'Warmth', line: "I view you as very homely and pleasant to be around. And to those close to you, you're a place of comfort and sunshine.", code: 'room.temperature++;',
    hx: 0.73, hy: 0.25, s: 0.115, f: mk({ petals: 14, layers: 1, hue: 52, w: 0.16, pt: 0.1, glyphs: 40, cs: 1.25 }) },
  { fn: 'glow()', title: 'Glow', line: "You quite literally glow; like physically. Can't explain it much further. You remind me very much of golden hour.", code: 'return gold + honey + sunset;',
    hx: 0.12, hy: 0.43, s: 0.1, f: mk({ petals: 10, layers: 3, hue: 18, w: 0.36, glyphs: 28 }) },
  { fn: 'love()', title: 'Love', line: 'You come across as someone who gives it freely and means it. Whoever you love is lucky.', code: 'return give(freely) && mean(it);',
    hx: 0.88, hy: 0.43, s: 0.1, f: mk({ petals: 8, layers: 4, hue: 8, w: 0.5, glyphs: 24 }) },
  { fn: 'earth()', title: 'Earth', line: 'Grounded and rich, the kind of place things grow from. You feel like home base.', code: 'return roots.deep;',
    hx: 0.36, hy: 0.43, s: 0.105, f: mk({ petals: 5, layers: 2, hue: 78, sat: 70, w: 0.42, glyphs: 22 }) },
  { fn: 'pearl()', title: 'Pearl', line: 'Rare, quietly bright, and worth being patient for.', code: 'return rare && radiant;',
    hx: 0.64, hy: 0.43, s: 0.105, f: mk({ petals: 8, layers: 3, hue: 40, sat: 32, dl: 16, w: 0.4, glyphs: 26 }) },
];
