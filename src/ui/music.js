import { SONGS } from '../pages/songs.js';
import { Sound } from '../audio/engine.js';
import { loadYouTubeApi } from './youtube-api.js';
import { activateSong as spotifyOn, deactivateSong as spotifyOff } from './song-player.js';

// Each page's real song, played by a YouTube player that sits in the page's sound card.
//
// Browsers only allow sound that starts inside a tap. So every player is built up front, while the opening screen
// plays, and playback is started from inside the tap itself: Enter on the opening screen, and every link to a page.
// If a video blocks embedding, the next candidate is tried, and the last resort is the Spotify player.

const PAGE_KEY = { bloom: 'bloom', bouquet: 'bouquet', 'golden-hour': 'golden', 'after-dark': 'dark' };
const players = new Map(); // song key -> { player, ready, started, idx, mode, timer, card }
let current = null;
let YTapi = null;

function setHint(card, show) {
  const hint = card.querySelector('.sound-hint');
  if (hint) hint.hidden = !show;
}

function pauseEntry(entry, key) {
  if (entry.mode === 'spotify') { spotifyOff(entry.card.closest('.view')); return; }
  if (entry.ready) { try { entry.player.pauseVideo(); } catch { /* player not usable yet */ } }
  clearTimeout(entry.timer);
}

/** Start the song, and if it has not begun a few seconds later, ask for a tap. */
function kick(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.ready) return;
  const now = Date.now();
  if (now - (entry.lastKick || 0) < 500) return; // the tap and the page opening both ask; once is enough
  entry.lastKick = now;
  try { entry.player.playVideo(); } catch { /* retried on the next tap */ }
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => { if (current === key && !entry.started) setHint(entry.card, true); }, 4000);
}

/** Last resort: swap this card to the Spotify player. */
function toSpotify(key) {
  const entry = players.get(key);
  if (!entry || entry.mode === 'spotify') return;
  entry.mode = 'spotify';
  try { if (entry.player) entry.player.destroy(); } catch { /* already gone */ }
  const slot = entry.card.querySelector('.sound-player');
  slot.innerHTML = '<div class="sound-target"></div>';
  entry.card.classList.add('spotify');
  setHint(entry.card, false);
  if (current === key) spotifyOn(entry.card.closest('.view'));
}

function onState(key, e) {
  const entry = players.get(key);
  if (!entry || !YTapi) return;
  if (e.data === YTapi.PlayerState.PLAYING) {
    if (current !== key) { try { entry.player.pauseVideo(); } catch { /* ignore */ } return; }
    entry.started = true;
    clearTimeout(entry.timer);
    setHint(entry.card, false);
    Sound.stop(); // the ambient music steps aside for the real song
  }
}

function onError(key) {
  const entry = players.get(key);
  if (!entry) return;
  if (entry.handledIdx === entry.idx) return; // one failed video can report twice
  entry.handledIdx = entry.idx;
  const next = SONGS[key].yt[entry.idx + 1];
  if (!next) { toSpotify(key); return; }
  entry.idx += 1;
  entry.started = false;
  entry.lastKick = Date.now();
  // Only the visible page may start playing; the others just line up the next video.
  if (current === key) entry.player.loadVideoById(next);
  else entry.player.cueVideoById(next);
}

function create(card, YT) {
  const key = card.dataset.song;
  const s = SONGS[key];
  const target = card.querySelector('.sound-target');
  const entry = { player: null, ready: false, started: false, idx: 0, mode: 'yt', timer: 0, card };
  players.set(key, entry);
  if (!YT || !target || !s.yt || !s.yt.length) { toSpotify(key); return; }
  const vars = { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, enablejsapi: 1 };
  if (location.protocol.startsWith('http')) vars.origin = location.origin;
  entry.player = new YT.Player(target, {
    width: '100%', height: '100%', videoId: s.yt[0], playerVars: vars,
    events: {
      onReady: () => { entry.ready = true; if (current === key) kick(key); },
      onStateChange: (e) => onState(key, e),
      onError: () => onError(key),
    },
  });
}

/** Play the song for a page, and pause every other song. Call from a tap handler where you can. */
export function playPage(key) {
  if (!key) return;
  current = key;
  players.forEach((entry, k) => { if (k !== key) pauseEntry(entry, k); });
  const entry = players.get(key);
  if (!entry) return;
  if (entry.mode === 'spotify') { spotifyOn(entry.card.closest('.view')); return; }
  kick(key);
}

/** Page hooks: the pages call these when they open and close. */
export function activateSong(root) {
  const card = root.querySelector('.sound[data-song]');
  if (card) playPage(card.dataset.song);
}
export function deactivateSong(root) {
  const card = root.querySelector('.sound[data-song]');
  if (!card) return;
  const key = card.dataset.song;
  if (current === key) current = null;
  const entry = players.get(key);
  if (entry) pauseEntry(entry, key);
}

export function initMusic() {
  loadYouTubeApi().then((YT) => {
    YTapi = YT;
    document.querySelectorAll('.sound[data-song]').forEach((card) => create(card, YT));
  });

  // Inside a tap: a link to a page starts that page's song right away. Any other tap retries a blocked song.
  const onTap = (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    const key = a && PAGE_KEY[a.getAttribute('href').slice(1)];
    if (key) { playPage(key); return; }
    const entry = current && players.get(current);
    if (entry && entry.mode === 'yt' && entry.ready && !entry.started) kick(current);
  };
  ['click', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, onTap, true));

  // Turning the ambient music on pauses whichever song is playing.
  Sound.onChange((on) => {
    if (!on || !current) return;
    const entry = players.get(current);
    if (entry) pauseEntry(entry, current);
  });
}
