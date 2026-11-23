import * as Tone from 'tone';
import { createVoices } from './voices.js';
import { createMoods } from './moods.js';

// Music made live in the browser. Tone.js owns the context, the effects chain and the clock.
const LEVEL = 0.75;
const listeners = new Set();

let ready = false;
let master, lp, bus, moods;
let on = false;
let wanted = null; // mood the page asked for
let playing = null; // mood currently running
let step = 0;
let fadeT = null;

async function init() {
  if (ready) return true;
  await Tone.start();
  master = new Tone.Gain(0).toDestination();
  const comp = new Tone.Compressor(-18, 3).connect(master);
  const reverb = new Tone.Reverb({ decay: 2.8, wet: 0.38 }).connect(comp);
  await reverb.ready;
  lp = new Tone.Filter(9000, 'lowpass').connect(reverb);
  bus = new Tone.Gain(1).connect(lp);
  moods = createMoods(createVoices(bus));
  ready = true;
  return true;
}

function notify() {
  listeners.forEach((fn) => fn(on));
}

function runMood(name) {
  const m = moods[name];
  const tr = Tone.getTransport();
  tr.cancel();
  tr.stop();
  tr.bpm.value = m.bpm;
  step = 0;
  tr.scheduleRepeat((time) => {
    const sd = 60 / m.bpm / 4;
    m.play(step % 16, time, Math.floor(step / 16) % m.prog.length, sd);
    step++;
  }, '16n');
  tr.start();
}

function apply() {
  if (!on || !wanted || wanted === playing) return;
  if (fadeT) clearTimeout(fadeT);
  master.gain.rampTo(0, 0.5);
  const target = wanted;
  fadeT = setTimeout(() => {
    if (!on) return;
    playing = target;
    runMood(target);
    master.gain.rampTo(LEVEL, 1.4);
  }, playing ? 520 : 0);
}

export const Sound = {
  isOn: () => on,
  onChange(fn) { listeners.add(fn); },
  async start() {
    if (!(await init())) return;
    if (Tone.getContext().state === 'suspended') await Tone.getContext().resume();
    on = true;
    notify();
    apply();
  },
  stop() {
    on = false;
    notify();
    if (!ready) return;
    if (fadeT) clearTimeout(fadeT);
    master.gain.rampTo(0, 0.5);
    setTimeout(() => {
      if (!on) { Tone.getTransport().stop(); Tone.getTransport().cancel(); playing = null; }
    }, 600);
  },
  setMood(name) { wanted = name; if (ready) apply(); },
  /** 0 is dull and dark, 1 is open. Used by the golden-hour slider. */
  setTone(x) {
    if (!ready) return;
    lp.frequency.rampTo(500 + 8500 * x * x, 0.25);
  },
  hidden(h) {
    if (!ready || !on) return;
    const raw = Tone.getContext().rawContext;
    if (h) raw.suspend(); else raw.resume();
  },
};
