import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { mountTilt } from '../../ui/tilt.js';
import { bindSongPlayers, unmountSongPlayers } from '../../ui/song-player.js';
import { bouquetMarkup } from './markup.js';
import { createBouquet } from './scene.js';

export function mountBouquet() {
  const root = $('v-bouquet');
  root.innerHTML = bouquetMarkup;
  const scene = createBouquet($('cv-bouquet'));
  bindSongPlayers(root);
  registerPage('bouquet', {
    scene: { ...scene, leave() { unmountSongPlayers(root); }, enter() { scene.enter(); mountTilt(root); } },
  });
}
