import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { mountTilt } from '../../ui/tilt.js';
import { activateSong, deactivateSong } from '../../ui/music.js';
import { bouquetMarkup } from './markup.js';
import { createBouquet } from './scene.js';

export function mountBouquet() {
  const root = $('v-bouquet');
  root.innerHTML = bouquetMarkup;
  const scene = createBouquet($('cv-bouquet'));
  registerPage('bouquet', {
    scene: { ...scene, leave() { deactivateSong(root); }, enter() { scene.enter(); mountTilt(root); activateSong(root); } },
  });
}
