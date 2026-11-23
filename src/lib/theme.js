// Theme state plus the canvas palettes. CSS tokens colour the UI; scenes draw with these values.

const KEY = 'carmen-theme';
const listeners = new Set();

export const PALETTES = {
  noir: {
    id: 'noir', label: 'Noir', light: false, swatch: ['#07090a', '#0f3d2e', '#e7c26a'], meta: '#07090a',
    hue: (h) => Math.min(h, 62), sat: 1, dl: 0,
    bloomBg: ['#0e1a12', '#24170b', '#4a2a0e'], bqBg: ['#13200f', '#2a1a0e'],
    glow: '242,177,52', bokeh: '255,214,120', fly: '255,210,122', vig: '4,5,3',
    stem: 'hsl(125,32%,32%)', blade: 'hsl(130,30%,22%)', leaf: [125, 36, 30], ground: '26,36,18',
    glyph: [45, 64], core: '255,210,122', rain: [[40, 50], [110, 135]], ribbon: ['#ffd86b', '#c98a1d', '#f2b134'],
  },
  terra: {
    id: 'terra', label: 'Terracotta', light: false, swatch: ['#1c110b', '#b5532e', '#e9a93b'], meta: '#1c110b',
    hue: (h) => h * 0.75 + 4, sat: 1.05, dl: 0,
    bloomBg: ['#241208', '#3a1c0e', '#6b2f16'], bqBg: ['#2a140a', '#4a2412'],
    glow: '233,140,59', bokeh: '255,190,120', fly: '255,196,130', vig: '12,5,2',
    stem: 'hsl(80,30%,30%)', blade: 'hsl(75,28%,22%)', leaf: [80, 34, 28], ground: '40,26,12',
    glyph: [35, 66], core: '255,190,110', rain: [[18, 40], [70, 90]], ribbon: ['#ffd98a', '#b5532e', '#e9a93b'],
  },
  ivory: {
    id: 'ivory', label: 'Ivory', light: true, swatch: ['#f6efe3', '#5a1624', '#b08d3e'], meta: '#f6efe3',
    hue: (h) => 348 + (h - 42) * 0.4, sat: 0.68, dl: -10,
    bloomBg: ['#f6efe3', '#efe2c8', '#e0cda6'], bqBg: ['#f6efe3', '#ead9b8'],
    glow: '176,141,62', bokeh: '176,141,62', fly: '176,141,62', vig: '90,60,40',
    stem: 'hsl(110,22%,34%)', blade: 'hsl(110,20%,38%)', leaf: [110, 24, 36], ground: '160,140,100',
    glyph: [38, 36], core: '176,141,62', rain: [[340, 355], [40, 50]], ribbon: ['#b08d3e', '#5a1624', '#7b1f33'],
  },
};

export const THEME_ORDER = ['noir', 'terra', 'ivory'];

let current = 'noir';

export function palette() {
  return PALETTES[current];
}

export function currentTheme() {
  return current;
}

export function setTheme(id, { persist = true } = {}) {
  if (!PALETTES[id]) id = 'noir';
  current = id;
  document.documentElement.dataset.theme = id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', PALETTES[id].meta);
  if (persist) {
    try { localStorage.setItem(KEY, id); } catch { /* storage can be blocked */ }
  }
  listeners.forEach((fn) => fn(id));
}

export function onTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* ignore */ }
  setTheme(PALETTES[saved] ? saved : 'noir', { persist: false });
}
