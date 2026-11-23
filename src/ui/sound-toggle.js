import { Sound } from '../audio/engine.js';
import { $ } from '../lib/util.js';

// Keeps the top-bar button and any "begin" buttons in step with the engine.
export function mountSoundToggle() {
  const btn = $('snd');
  const label = $('sndLabel');
  const sync = (on) => {
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Ambient on' : 'Ambient off';
    document.querySelectorAll('[data-sound-label]').forEach((el) => {
      el.textContent = on ? 'Ambient music is on' : 'Play ambient music';
    });
  };
  Sound.onChange(sync);
  btn.addEventListener('click', () => (Sound.isOn() ? Sound.stop() : Sound.start()));
  document.addEventListener('visibilitychange', () => Sound.hidden(document.hidden));
  sync(false);
}
