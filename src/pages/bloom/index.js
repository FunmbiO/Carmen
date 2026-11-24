import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { scrollPast } from '../../ui/scroll.js';
import { activateSong, deactivateSong } from '../../ui/music.js';
import { bloomMarkup, bloomCode } from './markup.js';


export function mountBloom() {
  const root = $('v-bloom');
  root.innerHTML = bloomMarkup;
  const canvas = $('cv-bloom');
  const hint = $('bouquetHint');
  const countEl = $('bouquetCount');
  const stage = $('stage3d');
  let touched = false;
  // The scroll down button shows while the bouquet is on screen, and hides during the opening and once she has scrolled past.
  const wrap = root.querySelector('.scroll-down-wrap');
  let cine = false, passed = false;
  const syncScrollButton = () => wrap.classList.toggle('away', cine || passed);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { passed = e.intersectionRatio < 0.2; syncScrollButton(); }, { root: $('views'), threshold: [0, 0.2, 0.5] }).observe(stage);
  }
  let api = null; // the 3D scene, loaded the first time the page opens
  let loading = null;
  let failed = false;
  let entered = false;

  const setCount = (n) => {
    const full = api && n >= api.max;
    countEl.textContent = full ? `${n} flowers. That's a full bouquet.` : `${n} flower${n === 1 ? '' : 's'}`;
  };
  const quietHint = () => { touched = true; hint.classList.add('gone'); };

  async function load() {
    if (api || failed) return;
    if (!loading) {
      loading = import('./bouquet3d.js').then((m) => {
        api = m.createBouquet3D(canvas, { onCount: setCount });
        api.onInteract(quietHint);
        // The opening shot: the title card plays, and the hint appears once it is over.
        api.onIntro({
          start: () => { stage.classList.add('is-cine'); hint.classList.add('gone'); cine = true; syncScrollButton(); },
          end: () => { stage.classList.remove('is-cine'); cine = false; syncScrollButton(); if (!touched) hint.classList.remove('gone'); },
        });
        if (new URLSearchParams(location.search).has('debug')) window.__bouquet = api; // for stepping the scene in tests
        setCount(api.count());
      }).catch((err) => {
        console.error('The 3D bouquet could not start', err);
        failed = true;
        $('bouquetFallback').hidden = false;
        canvas.hidden = true;
        hint.hidden = true;
        root.querySelectorAll('.bouquet-tools .btn').forEach((b) => { b.disabled = true; });
      });
    }
    await loading;
  }

  $('scrollDown').addEventListener('click', () => scrollPast(stage));
  $('again').addEventListener('click', () => api && api.replay());
  $('addFlower').addEventListener('click', () => {
    if (!api) return;
    if (!api.addFlower()) { setCount(api.count()); return; }
    quietHint();
  });
  $('scatter').addEventListener('click', () => { if (api) { api.scatter(); quietHint(); } });
  $('snap').addEventListener('click', async () => {
    if (!api) return;
    const btn = $('snap');
    const label = btn.textContent;
    btn.disabled = true;
    const result = await api.snapshot();
    btn.textContent = result === 'failed' ? 'Could not save' : result === 'shared' ? 'Shared' : 'Saved';
    setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 1800);
  });

  registerPage('bloom', {
    scene: {
      async enter() {
        mountTilt(root);
        activateSong(root);
        typeCode($('code-bloom'), bloomCode);
        await load();
        if (api) { api.resize(); if (!entered) { entered = true; api.replay(); } }
      },
      leave() { deactivateSong(root); },
      resize() { if (api) api.resize(); },
      draw(now, dt) { if (api) api.draw(now, dt); },
      visible: () => (api ? api.visible() : true),
    },
  });
}
