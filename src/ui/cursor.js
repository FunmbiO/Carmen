import { REDUCE } from '../lib/util.js';

// A soft gold glow that trails the pointer on desktop. The system cursor stays; this only adds light.
export function mountCursor() {
  if (REDUCE || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'cursor-glow';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, shown = false;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; el.style.opacity = '1'; x = tx; y = ty; }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { shown = false; el.style.opacity = '0'; });
  document.addEventListener('pointerover', (e) => {
    el.classList.toggle('on-action', !!e.target.closest('a, button, input, .chip, canvas'));
  });

  (function loop() {
    x += (tx - x) * 0.16; y += (ty - y) * 0.16;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
}
