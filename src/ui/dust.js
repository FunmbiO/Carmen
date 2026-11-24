import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { palette, onTheme } from '../lib/theme.js';
import { REDUCE } from '../lib/util.js';

// Slow gold dust drifting behind every page. Recoloured when the theme changes.
let container = null;
let booted = false;
let active = true; // false while the 3D bouquet is on screen, to leave the GPU to it

const toHex = (rgb) => '#' + rgb.split(',').map((n) => Number(n).toString(16).padStart(2, '0')).join('');

function options() {
  const P = palette();
  return {
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    fpsLimit: window.innerWidth < 640 ? 20 : 30,
    detectRetina: true,
    particles: {
      number: { value: window.innerWidth < 640 ? 16 : 36, density: { enable: true, width: 900, height: 900 } },
      paint: { fill: { enable: true, color: { value: toHex(P.fly) } } },
      opacity: { value: { min: 0.08, max: P.light ? 0.5 : 0.6 }, animation: { enable: !REDUCE, speed: 0.5, sync: false } },
      size: { value: { min: 0.6, max: 2.4 } },
      move: { enable: !REDUCE, speed: 0.35, direction: 'top', random: true, straight: false, outModes: { default: 'out' } },
      shape: { type: 'circle' },
    },
    interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
  };
}

async function load() {
  if (container) container.destroy();
  container = await tsParticles.load({ id: 'dust', options: options() });
  if (!active) container.pause();
}

/** Pause or resume the dust. It fades out while paused so it never looks frozen. */
export function setDustActive(on) {
  active = on;
  const el = document.getElementById('dust');
  if (el) el.classList.toggle('rest', !on);
  if (!container) return;
  if (on) container.play(); else container.pause();
}

export async function mountDust() {
  if (booted) return;
  booted = true;
  await loadSlim(tsParticles);
  await load();
  onTheme(() => load());
}
