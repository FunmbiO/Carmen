import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { palette, onTheme } from '../lib/theme.js';
import { REDUCE } from '../lib/util.js';

// Slow gold dust drifting behind every page. Recoloured when the theme changes.
let container = null;
let booted = false;

function options() {
  const P = palette();
  return {
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    fpsLimit: 40,
    detectRetina: true,
    particles: {
      number: { value: 44, density: { enable: true, width: 900, height: 900 } },
      color: { value: `rgb(${P.fly})` },
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
}

export async function mountDust() {
  if (booted) return;
  booted = true;
  await loadSlim(tsParticles);
  await load();
  onTheme(() => load());
}
