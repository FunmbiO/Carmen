import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { Sound } from '../../audio/engine.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { bindSongPlayers, unmountSongPlayers } from '../../ui/song-player.js';
import { bloomMarkup, bloomCode } from './markup.js';
import { createBloom } from './scene.js';

export function mountBloom() {
  const root = $('v-bloom');
  root.innerHTML = bloomMarkup;
  const bloom = createBloom($('cv-bloom'));

  $('plant').addEventListener('click', bloom.plant);
  $('again').addEventListener('click', bloom.replay);
  bindSongPlayers(root);
  $('begin').addEventListener('click', () => { if (!Sound.isOn()) Sound.start(); });

  registerPage('bloom', {
    scene: {
      ...bloom.scene,
      leave() { unmountSongPlayers(root); },
      enter() {
        bloom.scene.enter();
        mountTilt(root);
        typeCode($('code-bloom'), bloomCode);
      },
    },
  });
}
