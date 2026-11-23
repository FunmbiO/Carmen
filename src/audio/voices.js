import * as Tone from 'tone';

// Instrument voices built from raw oscillators and noise, routed into a Tone bus.
// Each voice is a short-lived node graph that cleans itself up when it ends.
export const N = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createVoices(bus) {
  const ctx = Tone.getContext();
  const ac = ctx.rawContext;
  const to = (node) => Tone.connect(node, bus);

  const noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  function osc(type, f, t, dur, vol, att, det) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = f;
    if (det) o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); to(g);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const rhodes = (f, t, dur, v) => {
    osc('sine', f, t, dur, v, 0.008);
    osc('sine', f * 2, t, dur * 0.5, v * 0.25, 0.005);
    osc('triangle', f * 4, t, 0.25, v * 0.08, 0.003);
  };
  const pluck = (f, t, v) => {
    osc('triangle', f, t, 0.7, v, 0.004);
    osc('sine', f * 2, t, 0.3, v * 0.3, 0.004);
  };
  const bass = (f, t, dur, v) => {
    osc('sine', f, t, dur, v, 0.03);
    osc('triangle', f * 2, t, dur * 0.5, v * 0.12, 0.03);
  };
  const sub = (f, t, dur, v) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(f * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); to(g);
    o.start(t); o.stop(t + dur + 0.05);
    osc('triangle', f * 2, t, dur * 0.6, v * 0.25, 0.01);
  };
  const pad = (f, t, dur, v, cut = 900) => {
    const g = ac.createGain();
    const fl = ac.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = cut;
    [-7, 7].forEach((d) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
      o.connect(fl); o.start(t); o.stop(t + dur + 1);
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 1);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8);
    fl.connect(g); to(g);
  };
  const lead = (f, t, dur, v) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const l = ac.createOscillator();
    const lg = ac.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    l.frequency.value = 5; lg.gain.value = 14;
    l.connect(lg); lg.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.1);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); to(g);
    o.start(t); l.start(t); o.stop(t + dur + 0.05); l.stop(t + dur + 0.05);
  };
  const noise = (t, dur, type, freq, v) => {
    const s = ac.createBufferSource();
    const fl = ac.createBiquadFilter();
    const g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = freq;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); to(g);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  };
  const kick = (t, v) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); to(g);
    o.start(t); o.stop(t + 0.45);
  };

  return { rhodes, pluck, bass, sub, pad, lead, noise, kick };
}
