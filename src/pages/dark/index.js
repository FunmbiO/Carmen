import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { mountTilt } from '../../ui/tilt.js';
import { activateSong, deactivateSong } from '../../ui/song-player.js';
import { goldBurst } from '../../ui/confetti.js';
import { revealLines, revealBlocks } from '../../ui/reveal.js';
import { darkMarkup, chanceCode } from './markup.js';
import { createRain } from './rain.js';

export function mountDark() {
  const root = $('v-after-dark');
  root.innerHTML = darkMarkup;
  const rain = createRain($('cv-dark'));
  const answer = $('answer');

  $('yes').addEventListener('click', () => {
    answer.textContent = "That's all I'm asking. Thank you for reading this far.";
    rain.rush();
    goldBurst({ x: 0.5, y: 0.75 });
  });
  $('no').addEventListener('click', () => {
    answer.textContent = "That's completely okay. I hope this made you smile anyway.";
    rain.rush();
  });

  registerPage('after-dark', {
    scene: {
      ...rain.scene,
      leave() { deactivateSong(root); },
      enter() {
        rain.scene.enter();
        mountTilt(root);
        activateSong(root);
        typeCode($('code-chance'), chanceCode);
        revealLines(root.querySelectorAll('.reveal-lines'));
        revealBlocks(root.querySelectorAll('.ask, .sig'));
      },
    },
  });
}
