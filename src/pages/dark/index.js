import { $ } from '../../lib/util.js';
import { registerPage } from '../../ui/router.js';
import { typeCode } from '../../ui/typewriter.js';
import { activateSong, deactivateSong } from '../../ui/music.js';
import { goldBurst } from '../../ui/confetti.js';
import { revealLines, revealBlocks } from '../../ui/reveal.js';
import { darkMarkup, chanceCode } from './markup.js';
import { REPLIES } from './replies.js';
import { recordPick, watchConnection } from './notify.js';
import { createRain } from './rain.js';

export function mountDark() {
  const root = $('v-after-dark');
  root.innerHTML = darkMarkup;
  const rain = createRain($('cv-dark'));
  const answer = $('answer');

  const replies = root.querySelectorAll('.reply');
  replies.forEach((btn) => {
    btn.addEventListener('click', () => {
      const r = REPLIES.find((x) => x.id === btn.dataset.reply);
      if (!r) return;
      replies.forEach((b) => { const on = b === btn; b.classList.toggle('is-chosen', on); b.setAttribute('aria-pressed', String(on)); });
      answer.textContent = r.answer;
      rain.rush();
      if (r.warm) goldBurst({ x: 0.5, y: 0.75 });
      recordPick(r.id); // lets the site owner know, in order
    });
  });

  watchConnection(); // retry any pick that could not be sent earlier

  registerPage('after-dark', {
    scene: {
      ...rain.scene,
      leave() { deactivateSong(root); },
      enter() {
        rain.scene.enter();
        activateSong(root);
        typeCode($('code-chance'), chanceCode);
        revealLines(root.querySelectorAll('.reveal-lines'));
        revealBlocks(root.querySelectorAll('.ask, .sig'));
      },
    },
  });
}
