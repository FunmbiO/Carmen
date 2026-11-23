import { PALETTES, THEME_ORDER, currentTheme, onTheme, setTheme } from '../lib/theme.js';

export function mountThemeSwitch(host) {
  const wrap = document.createElement('div');
  wrap.className = 'theme-switch';
  wrap.setAttribute('role', 'radiogroup');
  wrap.setAttribute('aria-label', 'Colour theme');

  THEME_ORDER.forEach((id) => {
    const p = PALETTES[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme-chip';
    b.setAttribute('role', 'radio');
    b.dataset.theme = id;
    b.title = p.label;
    b.setAttribute('aria-label', p.label + ' theme');
    b.innerHTML = p.swatch.map((c) => `<i style="background:${c}"></i>`).join('');
    b.addEventListener('click', () => setTheme(id));
    wrap.appendChild(b);
  });

  const sync = () => {
    wrap.querySelectorAll('.theme-chip').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.theme === currentTheme()));
    });
  };
  onTheme(sync);
  sync();
  host.appendChild(wrap);
  return wrap;
}
