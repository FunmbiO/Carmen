import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shapes.css';
import './styles/layout.css';
import './styles/theme-switch.css';
import './styles/intro.css';
import { initTheme } from './lib/theme.js';
import { mountThemeSwitch } from './ui/theme-switch.js';
import { mountDock } from './ui/dock.js';
import { startRouter, onPage, registerPage } from './ui/router.js';
import { startScroll, scrollTop } from './ui/scroll.js';
import { playIntro } from './intro/intro.js';
import { mountDust } from './ui/dust.js';
import { mountSoundToggle } from './ui/sound-toggle.js';
import { Sound } from './audio/engine.js';
import { PAGE_MOODS } from './audio/page-moods.js';

initTheme();
mountThemeSwitch(document.getElementById('theme-host'));
mountDock();
startScroll();
mountSoundToggle();
mountDust();

// Pages register themselves here as they are built.
const empty = { enter() {}, leave() {}, resize() {}, draw() {} };
['bloom', 'bouquet', 'golden-hour', 'after-dark'].forEach((n) => registerPage(n, { scene: empty }));
onPage((name) => { scrollTop(); Sound.setMood(PAGE_MOODS[name]); });

// Greet first visitors. A deep link (#bouquet) or ?intro=0 goes straight in.
const skipIntro = location.hash.length > 1 || new URLSearchParams(location.search).get('intro') === '0';
(async () => {
  if (!skipIntro) await playIntro();
  startRouter();
})();
