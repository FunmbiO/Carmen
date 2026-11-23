import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shapes.css';
import './styles/theme-switch.css';
import { initTheme } from './lib/theme.js';
import { mountThemeSwitch } from './ui/theme-switch.js';

initTheme();

const app = document.getElementById('app');
app.innerHTML = `
  <main style="display:grid;place-content:center;gap:24px;height:100%;padding:24px;text-align:center">
    <p class="script foil" style="font-size:clamp(72px,18vw,160px)">Hey Carmen</p>
    <div class="orn"><i></i></div>
    <div id="sw" style="justify-self:center"></div>
  </main>`;
mountThemeSwitch(document.getElementById('sw'));
