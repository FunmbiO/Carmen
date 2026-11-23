// Thin front for the audio engine. Tone.js is large, so it loads on demand and is preloaded when idle.
const listeners = new Set();
let on = false;
let wanted = null;
let core = null;
let loading = null;

function load() {
  if (core) return Promise.resolve(core);
  if (!loading) {
    loading = import('./tone-engine.js').then((m) => {
      core = m.Sound;
      core.onChange((v) => { on = v; listeners.forEach((fn) => fn(v)); });
      if (wanted) core.setMood(wanted);
      return core;
    });
  }
  return loading;
}

export const Sound = {
  isOn: () => on,
  onChange(fn) { listeners.add(fn); },
  preload() { load(); },
  async start() { const c = await load(); await c.start(); },
  stop() { if (core) core.stop(); },
  setMood(name) { wanted = name; if (core) core.setMood(name); },
  setTone(x) { if (core) core.setTone(x); },
  hidden(h) { if (core) core.hidden(h); },
};
