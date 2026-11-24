// Volume ramps for the music players. Phones that ignore volume simply skip the fade.
export function ramp(entry, to, ms, done) {
  clearInterval(entry.fade);
  if (!entry.ready) { if (done) done(); return; }
  const from = entry.vol == null ? 100 : entry.vol;
  const t0 = performance.now();
  entry.fade = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    entry.vol = Math.round(from + (to - from) * k);
    try { entry.player.setVolume(entry.vol); } catch { /* not ready */ }
    if (k >= 1) { clearInterval(entry.fade); if (done) done(); }
  }, 60);
}
