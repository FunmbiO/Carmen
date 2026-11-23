import { SONGS, embedUrl } from '../pages/songs.js';
import { Sound } from '../audio/engine.js';

// Swaps a sound card's buttons for the real Spotify player. The ambient music stops while a song plays.
// Spotify plays the full track when she is signed in to Spotify in this browser, and a 30 second preview otherwise.

function mount(card) {
  const s = SONGS[card.dataset.song];
  const slot = card.querySelector('.sound-player');
  if (!s || !slot || slot.firstChild) return;
  const frame = document.createElement('iframe');
  frame.src = embedUrl(s);
  frame.title = `${s.title} by ${s.by}`;
  frame.height = s.kind === 'album' ? '152' : '152';
  frame.loading = 'lazy';
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  slot.appendChild(frame);
  slot.hidden = false;
  card.classList.add('playing');
  Sound.stop();
}

/** Remove the player so the song stops when she leaves the page. */
export function unmountSongPlayers(root) {
  root.querySelectorAll('.sound').forEach((card) => {
    const slot = card.querySelector('.sound-player');
    if (!slot) return;
    slot.innerHTML = '';
    slot.hidden = true;
    card.classList.remove('playing');
  });
}

export function bindSongPlayers(root) {
  root.querySelectorAll('.sound [data-play]').forEach((btn) => {
    btn.addEventListener('click', () => mount(btn.closest('.sound')));
  });
}
