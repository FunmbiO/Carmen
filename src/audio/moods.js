import { N } from './voices.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// One mood per page. Each plays a 16-step bar pattern over a four-chord loop.
export function createMoods(v) {
  const { rhodes, pluck, bass, sub, pad, lead, noise, kick } = v;
  return {
    sade: {
      bpm: 68,
      prog: [{ b: 38, c: [60, 64, 65, 69] }, { b: 43, c: [59, 62, 64, 65] }, { b: 36, c: [59, 62, 64, 67] }, { b: 41, c: [57, 60, 64, 67] }],
      play(s, t, bar, sd) {
        const ch = this.prog[bar], beat = sd * 4;
        if (s === 0) {
          ch.c.forEach((n, i) => rhodes(N(n), t + i * 0.014, beat * 3.5, 0.07));
          bass(N(ch.b), t, beat * 2.5, 0.3); kick(t, 0.14);
        }
        if (s === 10) { ch.c.slice(1).forEach((n, i) => rhodes(N(n), t + i * 0.01, beat * 1.8, 0.04)); kick(t, 0.1); }
        if (s === 6) bass(N(ch.b + (bar % 2 ? 7 : 0)), t, beat * 1.2, 0.2);
        if (s === 14) bass(N(ch.b + 12), t, beat * 0.9, 0.14);
        if (s % 4 === 2) noise(t, 0.07, 'highpass', 6500, 0.035);
        if (s === 4 || s === 12) noise(t, 0.06, 'bandpass', 2400, 0.06);
        if ((s === 6 || s === 12) && Math.random() < 0.55) lead(N(pick(ch.c) + 12), t, beat * 1.6, 0.05);
      },
    },
    jhene: {
      bpm: 78,
      prog: [{ b: 41, c: [60, 64, 67, 69] }, { b: 40, c: [59, 62, 66, 67] }, { b: 38, c: [60, 64, 65, 69] }, { b: 36, c: [59, 62, 64, 67] }],
      play(s, t, bar, sd) {
        const ch = this.prog[bar], beat = sd * 4;
        if (s === 0) {
          ch.c.forEach((n) => pad(N(n), t, beat * 4, 0.028, 1100));
          bass(N(ch.b), t, beat * 3.6, 0.26);
          if (bar % 2 === 0) kick(t, 0.12);
        }
        const k = [0, 3, 6, 8, 11, 14].indexOf(s);
        if (k >= 0) pluck(N(ch.c[[0, 2, 1, 3, 2, 1][k]] + 12), t, 0.075);
        if (s === 8) noise(t, 0.1, 'bandpass', 1600, 0.05);
        if (s % 4 === 2) noise(t, 0.05, 'highpass', 8000, 0.02);
        if (s === 12 && Math.random() < 0.4) pluck(N(ch.c[3] + 24), t, 0.04);
      },
    },
    golden: {
      bpm: 64,
      prog: [{ b: 45, c: [64, 68, 71, 73] }, { b: 42, c: [64, 68, 69, 73] }, { b: 38, c: [64, 66, 69, 73] }, { b: 40, c: [66, 68, 71, 73] }],
      play(s, t, bar, sd) {
        const ch = this.prog[bar], beat = sd * 4;
        if (s === 0) {
          ch.c.forEach((n, i) => { rhodes(N(n), t + i * 0.014, beat * 3.8, 0.065); pad(N(n - 12), t, beat * 4, 0.016, 800); });
          bass(N(ch.b), t, beat * 3, 0.28); kick(t, 0.12);
        }
        if (s === 8) {
          bass(N(ch.b + 7), t, beat * 1.6, 0.18);
          ch.c.slice(2).forEach((n) => rhodes(N(n), t, beat * 1.5, 0.035));
        }
        if (s % 4 === 2) noise(t, 0.09, 'highpass', 5500, 0.03);
        if (s === 4 || s === 12) noise(t, 0.06, 'bandpass', 2000, 0.05);
        if (s === 12 && Math.random() < 0.6) pluck(N(pick(ch.c) + 12), t, 0.05);
        if ((s === 6 || s === 14) && Math.random() < 0.5) lead(N(pick(ch.c) + 12), t, beat * 1.5, 0.045);
      },
    },
    dark: {
      bpm: 70,
      prog: [{ b: 48, c: [63, 67, 70, 74] }, { b: 44, c: [60, 63, 67, 68] }, { b: 41, c: [65, 68, 72, 75] }, { b: 43, c: [59, 62, 65, 67] }],
      play(s, t, bar, sd) {
        const ch = this.prog[bar], beat = sd * 4;
        if (s === 0) {
          ch.c.forEach((n) => pad(N(n - 12), t, beat * 3.8, 0.022, 520));
          sub(N(ch.b), t, beat * 2.2, 0.42); kick(t, 0.32);
        }
        if (s === 10) { sub(N(ch.b), t, beat * 1.2, 0.34); kick(t, 0.28); }
        if (s === 8) { noise(t, 0.16, 'bandpass', 1700, 0.16); noise(t, 0.12, 'highpass', 3000, 0.06); }
        if (s % 2 === 0) noise(t, 0.035, 'highpass', 8500, s % 4 === 0 ? 0.05 : 0.03);
        if ((s === 14 || s === 15) && Math.random() < 0.5) noise(t + sd * 0.5, 0.03, 'highpass', 8500, 0.03);
        if (s === 0 || s === 6 || s === 11) pluck(N(ch.c[s === 6 ? 2 : s === 11 ? 3 : 0] + 12), t, 0.06);
      },
    },
  };
}
