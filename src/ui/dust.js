import { palette } from '../lib/theme.js';
import { REDUCE } from '../lib/util.js';

// Slow gold dust drifting behind every page. One small canvas, no library. It takes its colour from the theme on every frame.
const small = window.innerWidth < 640;
const COUNT = small ? 16 : 36;
const STEP = 1000 / (small ? 20 : 30);

let cv = null;
let ctx = null;
let motes = [];
let w = 0;
let h = 0;
let dpr = 1;
let running = false;
let active = true;
let last = 0;
let booted = false;

const seed = () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.015 + Math.random() * 0.03, ph: Math.random() * 6.28, sway: Math.random() * 0.02 });

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth; h = window.innerHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw(now) {
  const P = palette();
  const max = P.light ? 0.5 : 0.6;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `rgb(${P.fly})`;
  for (const m of motes) {
    if (!REDUCE) { m.y -= m.v / 30; m.x += Math.sin(now / 4000 + m.ph) * m.sway / 30; }
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    ctx.globalAlpha = 0.08 + (max - 0.08) * (0.5 + 0.5 * Math.sin(now / 2500 + m.ph));
    ctx.beginPath(); ctx.arc(m.x * w, m.y * h, m.r, 0, 6.2832); ctx.fill();
  }
}

function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  if (now - last < STEP) return;
  last = now;
  draw(now);
}

function sync() {
  const go = active && !document.hidden;
  if (go && !running) { running = true; requestAnimationFrame(frame); }
  else if (!go) running = false;
}

/** Pause or resume the dust. It fades out while paused so it never looks frozen. */
export function setDustActive(on) {
  active = on;
  const el = document.getElementById('dust');
  if (el) el.classList.toggle('rest', !on);
  if (cv) sync();
}

export async function mountDust() {
  if (booted) return;
  booted = true;
  const host = document.getElementById('dust');
  if (!host) return;
  cv = document.createElement('canvas');
  host.appendChild(cv);
  ctx = cv.getContext('2d');
  if (!ctx) return;
  motes = Array.from({ length: COUNT }, seed);
  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  if (REDUCE) draw(0); else sync();
}
