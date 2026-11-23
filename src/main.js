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
import { mountDock } from './ui/dock.js';
import { startRouter, onPage } from './ui/router.js';
import { startScroll, scrollTop } from './ui/scroll.js';
import { playPageTransition } from './ui/transition.js';
import { mountBloom } from './pages/bloom/index.js';
import { mountBouquet } from './pages/bouquet/index.js';
import { mountGolden } from './pages/golden/index.js';
import { mountDark } from './pages/dark/index.js';
import { mountDust } from './ui/dust.js';
import { mountCursor } from './ui/cursor.js';
import { initMusic } from './ui/music.js';
import { mountSoundToggle } from './ui/sound-toggle.js';
import { Sound } from './audio/engine.js';
import { PAGE_MOODS } from './audio/page-moods.js';

initTheme();
mountThemeSwitch(document.getElementById('theme-host'));
mountDock();
startScroll();
mountSoundToggle();
(window.requestIdleCallback || setTimeout)(() => Sound.preload());
mountDust();
mountCursor();

mountBloom();
mountBouquet();
mountGolden();
mountDark();
initMusic();
let firstPage = true;
onPage((name) => {
  scrollTop();
  Sound.setMood(PAGE_MOODS[name]);
  if (!firstPage) playPageTransition();
  firstPage = false;
});

// Greet first visitors. A deep link (#bouquet) or ?intro=0 goes straight in.
const skipIntro = location.hash.length > 1 || new URLSearchParams(location.search).get('intro') === '0';
(async () => {
  if (!skipIntro) {
    // Three.js is only needed for the opening, so it loads on demand.
    const { playIntro } = await import('./intro/intro.js');
    await playIntro();
  }
  startRouter();
})();
