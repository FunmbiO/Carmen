// The vinyl card's controls and readouts. This file only touches the card; the music logic lives in ../music.js.
export const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function setHint(card, show) {
  const hint = card.querySelector('.sound-hint');
  if (hint) hint.hidden = !show;
}

export function setPlayingClass(card, on) {
  card.classList.toggle('is-playing', on);
}

export function paintProgress(entry, t, d) {
  const frac = Math.min(1, t / d);
  entry.fill.style.width = (frac * 100).toFixed(2) + '%';
  entry.time.textContent = fmt(t);
  entry.scrub.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
}

/** Wire the play/pause buttons and the progress bar to callbacks. */
export function bindControls(entry, { onToggle, onSeekTo, onSeekBy }) {
  entry.card.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', onToggle));
  if (!entry.scrub) return;
  entry.scrub.addEventListener('click', (e) => {
    const r = entry.scrub.getBoundingClientRect();
    onSeekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  });
  entry.scrub.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    onSeekBy(e.key === 'ArrowRight' ? 10 : -10);
  });
}
