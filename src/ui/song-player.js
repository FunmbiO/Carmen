import { SONGS, embedUrl } from '../pages/songs.js';
import { Sound } from '../audio/engine.js';
import { loadSpotifyApi } from './spotify-api.js';

// Each page's song starts when she opens the page and pauses when she leaves.
// Spotify plays the full track when she is signed in to Spotify in this browser, and a 30 second preview otherwise.
// Browsers only allow sound after she has tapped something. Entering the site and using the dock both count.

const players = new Map(); // song key -> { controller, hint, started }
let current = null;

const uri = (s) => `spotify:${s.kind}:${s.id}`;

function setHint(card, show) {
  const hint = card.querySelector('.sound-hint');
  if (hint) hint.hidden = !show;
}

/** Plain iframe, used if Spotify's API script cannot load. The player's own play button still works. */
function fallbackFrame(card, s) {
  const slot = card.querySelector('.sound-player');
  slot.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.src = embedUrl(s);
  frame.title = `${s.title} by ${s.by}`;
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  slot.appendChild(frame);
  setHint(card, true);
}

async function create(card, key) {
  const s = SONGS[key];
  const target = card.querySelector('.sound-target');
  const entry = { controller: null, started: false, timer: 0 };
  players.set(key, entry);
  const api = await loadSpotifyApi();
  if (!api || !target) { fallbackFrame(card, s); return entry; }

  api.createController(target, { uri: uri(s), width: '100%', height: 152 }, (controller) => {
    entry.controller = controller;
    controller.addListener('ready', () => { if (current === key) start(card, key); });
    controller.addListener('playback_update', (e) => {
      const d = e.data || {};
      if (d.isPaused === false && !d.isBuffering) {
        entry.started = true;
        clearTimeout(entry.timer);
        setHint(card, false);
        Sound.stop(); // the ambient music steps aside for the real song
      }
    });
    if (current === key) start(card, key);
  });
  return entry;
}

function start(card, key) {
  const entry = players.get(key);
  if (!entry || !entry.controller) return;
  entry.controller.play();
  // If nothing is playing a few seconds later, the browser blocked it. Show a hint.
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => { if (current === key && !entry.started) setHint(card, true); }, 3500);
}

/** Call when a page opens. Creates its player the first time, then plays. */
export function activateSong(root) {
  const card = root.querySelector('.sound[data-song]');
  if (!card) return;
  const key = card.dataset.song;
  current = key;
  const entry = players.get(key);
  if (!entry) { create(card, key); return; }
  if (entry.controller) {
    entry.started ? entry.controller.resume() : entry.controller.play();
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => { if (current === key && !entry.started) setHint(card, true); }, 3500);
  }
}

/** Call when a page closes. The song pauses where it is. */
export function deactivateSong(root) {
  const card = root.querySelector('.sound[data-song]');
  if (!card) return;
  const key = card.dataset.song;
  const entry = players.get(key);
  if (current === key) current = null;
  if (entry) {
    clearTimeout(entry.timer);
    if (entry.controller) entry.controller.pause();
  }
}

// Turning the ambient music on pauses whichever song is playing.
Sound.onChange((on) => {
  if (!on || !current) return;
  const entry = players.get(current);
  if (entry && entry.controller) entry.controller.pause();
});
