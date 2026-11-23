import confetti from 'canvas-confetti';
import { palette } from '../lib/theme.js';
import { REDUCE } from '../lib/util.js';

// A gold burst. Colours follow the active theme.
const COLORS = {
  noir: ['#e7c26a', '#fff0b8', '#f2c75c', '#0f3d2e', '#e8b4a0'],
  terra: ['#e9a93b', '#ffd98a', '#b5532e', '#e07a52', '#a9b86a'],
  ivory: ['#5a1624', '#b08d3e', '#7b1f33', '#8fa58a', '#e8b4a0'],
};

export function goldBurst(origin = { x: 0.5, y: 0.7 }) {
  if (REDUCE) return;
  const colors = COLORS[palette().id];
  const base = { colors, origin, shapes: ['square'], scalar: 0.9, ticks: 220, disableForReducedMotion: true };
  confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 42 });
  setTimeout(() => confetti({ ...base, particleCount: 40, spread: 110, startVelocity: 28, decay: 0.92 }), 160);
}
