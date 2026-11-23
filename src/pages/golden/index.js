import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { goldenMarkup } from './markup.js';
import { createGolden } from './scene.js';
import { SUN_CODE } from './data.js';

export function mountGolden() {
  const root = $('v-golden-hour');
  root.innerHTML = goldenMarkup;
  const scene = createGolden($('cv-golden'));
  registerPage('golden-hour', {
    scene: {
      ...scene,
      enter() { scene.enter(); mountTilt(root); typeCode($('code-sun'), SUN_CODE); },
    },
  });
}
