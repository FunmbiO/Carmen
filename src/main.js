import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shapes.css';
import './styles/layout.css';
import './styles/theme-switch.css';
import './styles/intro.css';
import './styles/page-common.css';
import './styles/bouquet.css';
import './styles/golden.css';
import './styles/dark.css';
import './styles/vinyl.css';
import { initTheme } from './lib/theme.js';
import { mountThemeSwitch } from './ui/theme-switch.js';
import { startRouter, onPage } from './ui/router.js';
import { startScroll, scrollTop } from './ui/scroll.js';
import { playPageTransition } from './ui/transition.js';
import { mountBloom } from './pages/bloom/index.js';
import { mountBouquet } from './pages/bouquet/index.js';
import { mountGolden } from './pages/golden/index.js';
import { mountDark } from './pages/dark/index.js';
import { mountDust, setDustActive } from './ui/dust.js';
import { mountCursor } from './ui/cursor.js';
import { initMusic, releaseIntro } from './ui/music.js';

initTheme();
mountThemeSwitch(document.getElementById('theme-host'));
startScroll();
mountDust().catch((err) => console.warn('The dust layer could not start', err));
mountCursor();

mountBloom();
mountBouquet();
mountGolden();
mountDark();
initMusic();
let firstPage = true;
onPage((name) => {
  scrollTop();
  setDustActive(name !== 'bloom');
  if (!firstPage) playPageTransition();
  firstPage = false;
});

// Greet first visitors. A deep link (#bouquet) or ?intro=0 goes straight in.
const skipIntro = location.hash.length > 1 || new URLSearchParams(location.search).get('intro') === '0';
(async () => {
  if (!skipIntro) {
    try {
      // Three.js is only needed for the opening, so it loads on demand.
      const { playIntro } = await import('./intro/intro.js');
      await playIntro();
    } catch (err) {
      // No WebGL, or anything else going wrong, must never leave a blank page: skip the opening and go in.
      console.error('The opening could not play, going straight in', err);
      const intro = document.getElementById('intro');
      intro.hidden = true;
      intro.innerHTML = '';
    }
  }
  releaseIntro(); // however she got in, the opening's music player is no longer needed
  startRouter();
})();
