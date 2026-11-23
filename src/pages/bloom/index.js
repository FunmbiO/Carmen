import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { activateSong, deactivateSong } from '../../ui/music.js';
import { bloomMarkup, bloomCode } from './markup.js';

const LIMIT = 16;

export function mountBloom() {
  const root = $('v-bloom');
  root.innerHTML = bloomMarkup;
  const canvas = $('cv-bloom');
  const hint = $('bouquetHint');
  const countEl = $('bouquetCount');
  let api = null; // the 3D scene, loaded the first time the page opens
  let loading = null;
  let failed = false;
  let entered = false;

  const setCount = (n) => { countEl.textContent = n >= LIMIT ? `${n} flowers. That's a full bouquet.` : `${n} flower${n === 1 ? '' : 's'}`; };
  const quietHint = () => { hint.classList.add('gone'); };

  async function load() {
    if (api || failed) return;
    if (!loading) {
      loading = import('./bouquet3d.js').then((m) => {
        api = m.createBouquet3D(canvas, { onCount: setCount });
        api.onInteract(quietHint);
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

  $('again').addEventListener('click', () => api && api.replay());
  $('addFlower').addEventListener('click', () => {
    if (!api) return;
    if (!api.addFlower()) { setCount(LIMIT); return; }
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
    },
  });
}
