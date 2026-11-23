// Developer-only preview of the flower engine across themes. Run with `npm run dev` and open /dev/lab.html.
import '../src/styles/fonts.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import '../src/styles/shapes.css';
import '../src/styles/theme-switch.css';
import { initTheme, palette } from '../src/lib/theme.js';
import { mountThemeSwitch } from '../src/ui/theme-switch.js';
import { mk, drawHead } from '../src/lib/flowers.js';
import { bokeh, vignette, makeFlies, drawFlies } from '../src/lib/ambience.js';
import { fit, clock } from '../src/lib/util.js';

initTheme();
mountThemeSwitch(document.getElementById('theme-host'));
const cv = document.getElementById('lab');
document.querySelector('.frame').style.padding = '0';
let r = fit(cv, (w) => Math.round(w * 0.7));
addEventListener('resize', () => { r = fit(cv, (w) => Math.round(w * 0.7)); });
const flies = makeFlies(24);
const specs = [
  [0.5, 0.45, 0.26, mk({ petals: 8, layers: 5, hue: 42, glyphs: 110, glow: true })],
  [0.14, 0.7, 0.09, mk({ petals: 6, layers: 3, hue: 22 })],
  [0.86, 0.7, 0.1, mk({ petals: 9, layers: 3, hue: 15 })],
  [0.2, 0.2, 0.07, mk({ petals: 14, layers: 1, hue: 52, w: 0.16, pt: 0.1 })],
  [0.82, 0.22, 0.08, mk({ petals: 5, layers: 2, hue: 78, sat: 70 })],
];
let last = 0;
(function loop() {
  const now = clock(), dt = Math.min(0.05, now - last); last = now;
  const { c, W, H } = r, P = palette();
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.bloomBg[0]); g.addColorStop(0.6, P.bloomBg[1]); g.addColorStop(1, P.bloomBg[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  bokeh(c, W, H, now); drawFlies(c, W, H, now, dt, flies, 1);
  specs.forEach(([x, y, s, f]) => drawHead(c, f, x * W, y * H, s * W, 1, now));
  vignette(c, W, H);
  requestAnimationFrame(loop);
})();
