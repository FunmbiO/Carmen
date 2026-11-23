import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { activateSong, deactivateSong } from '../../ui/music.js';
import { bloomMarkup, bloomCode } from './markup.js';
import { createBloom } from './scene.js';

export function mountBloom() {
  const root = $('v-bloom');
  root.innerHTML = bloomMarkup;
  const bloom = createBloom($('cv-bloom'));

  $('plant').addEventListener('click', bloom.plant);
  $('again').addEventListener('click', bloom.replay);

  registerPage('bloom', {
    scene: {
      ...bloom.scene,
      leave() { deactivateSong(root); },
      enter() {
        bloom.scene.enter();
        mountTilt(root);
        activateSong(root);
        typeCode($('code-bloom'), bloomCode);
      },
    },
  });
}
