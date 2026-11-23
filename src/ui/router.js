import { $ } from '../lib/util.js';

// Hash router. Each page registers a scene with enter / leave / resize / draw.
const pages = new Map();
let cur = null;
let curName = null;
let last = 0;
const hooks = new Set();

export function registerPage(name, def) {
  pages.set(name, def);
}

export function onPage(fn) {
  hooks.add(fn);
}

export function currentPage() {
  return curName;
}

export function show(name) {
  if (!pages.has(name)) name = 'bloom';
  if (cur && curName !== name && cur.scene.leave) cur.scene.leave();
  pages.forEach((_, k) => {
    const el = $('v-' + k);
    if (el) el.hidden = k !== name;
  });
  document.querySelectorAll('.dock a').forEach((a) => {
    if (a.dataset.p === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const prev = curName;
  curName = name;
  cur = pages.get(name);
  $('views').scrollTop = 0;
  if (cur.scene.enter) cur.scene.enter();
  hooks.forEach((fn) => fn(name, prev, cur));
}

export function startRouter() {
  const route = () => show(location.hash.replace('#', ''));
  window.addEventListener('hashchange', route);

  let rz = null;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => cur && cur.scene.resize && cur.scene.resize(), 120);
  });

  const loop = () => {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;
    if (!document.hidden && cur && cur.scene.draw) cur.scene.draw(now, dt);
    requestAnimationFrame(loop);
  };
  route();
  requestAnimationFrame(loop);
}
