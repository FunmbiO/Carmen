import { SONGS } from '../pages/songs.js';
import { Sound } from '../audio/engine.js';
import { loadYouTubeApi } from './youtube-api.js';
import { activateSong as spotifyOn, deactivateSong as spotifyOff } from './song-player.js';
import { ramp } from './music/fade.js';
import { setHint, setPlayingClass, paintProgress, bindControls } from './music/view.js';

// Each page's real song, played by a YouTube player that stays hidden behind the vinyl card.
//
// Browsers only allow sound that starts inside a tap, so every player is built up front and playback is started
// from inside the tap itself: the first tap, Enter, and every link to a page.
//
// Reliability rules, because a missed start is the worst failure here:
//  - Whether a song is playing is read from the player (getPlayerState), never from a flag that can go stale.
//  - Asking for a song is never dropped: if the player is not ready yet it starts the moment it is.
//  - A song that has been asked for is retried every half second until it plays. After three seconds a hint
//    asks for a tap, and any tap anywhere retries it inside that tap.
//  - A player that never becomes ready is rebuilt, and only then replaced by the Spotify player.
//  - Coming back to the tab or page retries as well.

const PAGE_KEY = { bloom: 'bloom', bouquet: 'bouquet', 'golden-hour': 'golden', 'after-dark': 'dark' };
const FADE_MS = 900;
const READY_TIMEOUT_MS = 8000;
const players = new Map(); // song key -> entry
let current = null;
let YTapi = null;

/** True while the player is playing or buffering toward playing. */
function isPlaying(entry) {
  try {
    const s = entry.player.getPlayerState();
    return s === 1 || s === 3;
  } catch { return false; }
}

function wantsMusic(entry) {
  return entry && entry.mode === 'yt' && entry.ready && !entry.userPaused;
}

function pauseEntry(entry, key) {
  if (entry.mode === 'spotify') { spotifyOff(entry.card.closest('.view')); return; }
  clearInterval(entry.watch);
  if (!entry.ready) return;
  if (!isPlaying(entry)) { try { entry.player.pauseVideo(); } catch { /* ignore */ } return; }
  // Fade out, then pause, unless she has come back to this song in the meantime.
  ramp(entry, 0, FADE_MS, () => {
    if (current === key) return;
    try { entry.player.pauseVideo(); entry.player.setVolume(100); } catch { /* ignore */ }
    entry.vol = 100;
  });
}

/** Retry playVideo until the song is really playing, and ask for a tap if it takes too long. */
function watch(key) {
  const entry = players.get(key);
  if (!entry) return;
  clearInterval(entry.watch);
  let n = 0;
  entry.watch = setInterval(() => {
    if (current !== key || entry.userPaused || entry.mode !== 'yt') { clearInterval(entry.watch); return; }
    if (isPlaying(entry)) { clearInterval(entry.watch); setHint(entry.card, false); return; }
    n += 1;
    try { entry.player.playVideo(); } catch { /* retried */ }
    if (n === 6) setHint(entry.card, true);
    if (n >= 60) clearInterval(entry.watch); // give up quietly after 30 seconds; a tap still retries
  }, 500);
}

/** Ask for the song. Safe to call any number of times. */
function kick(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.ready) return; // onReady asks again
  if (isPlaying(entry)) { ramp(entry, 100, FADE_MS); watch(key); return; }
  try {
    entry.vol = 0;
    entry.player.setVolume(0);
    entry.player.playVideo();
  } catch { /* the watch loop retries */ }
  ramp(entry, 100, FADE_MS);
  watch(key);
}

/** Last resort: swap this card to the Spotify player. */
function toSpotify(key) {
  const entry = players.get(key);
  if (!entry || entry.mode === 'spotify') return;
  entry.mode = 'spotify';
  clearInterval(entry.fade);
  clearInterval(entry.watch);
  clearTimeout(entry.readyTimer);
  try { if (entry.player) entry.player.destroy(); } catch { /* already gone */ }
  entry.card.querySelector('.sound-player').innerHTML = '<div class="sound-target"></div>';
  entry.card.classList.add('spotify');
  setPlayingClass(entry.card, false);
  setHint(entry.card, false);
  if (current === key) spotifyOn(entry.card.closest('.view'));
}

function onState(key, e) {
  const entry = players.get(key);
  if (!entry || !YTapi) return;
  const S = YTapi.PlayerState;
  if (e.data === S.PLAYING) {
    if (current !== key) { try { entry.player.pauseVideo(); } catch { /* ignore */ } return; }
    setPlayingClass(entry.card, true);
    setHint(entry.card, false);
    Sound.stop(); // the ambient music steps aside for the real song
  } else if (e.data === S.PAUSED) {
    setPlayingClass(entry.card, false);
  } else if (e.data === S.ENDED) {
    setPlayingClass(entry.card, false);
    if (current === key) { try { entry.player.seekTo(0, true); entry.player.playVideo(); } catch { /* ignore */ } } // loop
  }
}

function onError(key) {
  const entry = players.get(key);
  if (!entry) return;
  if (entry.handledIdx === entry.idx) return; // one failed video can report twice
  entry.handledIdx = entry.idx;
  const id = SONGS[key].yt[entry.idx];
  const next = SONGS[key].yt[entry.idx + 1];
  if (!entry.retriedSame) { // often a passing network or player hiccup: try the same video once more first
    entry.retriedSame = true;
    entry.handledIdx = -1;
    if (current === key) entry.player.loadVideoById(id); else entry.player.cueVideoById(id);
    return;
  }
  entry.retriedSame = false;
  if (!next) { toSpotify(key); return; }
  entry.idx += 1;
  if (current === key) entry.player.loadVideoById(next); else entry.player.cueVideoById(next);
}

/** Build (or rebuild) a card's YouTube player. */
function create(card, YT) {
  const key = card.dataset.song;
  const s = SONGS[key];
  const target = card.querySelector('.sound-target');
  let entry = players.get(key);
  if (!entry) {
    entry = {
      player: null, ready: false, userPaused: false, idx: 0, mode: 'yt', watch: 0, fade: 0, vol: 100, rebuilds: 0, card,
      fill: card.querySelector('.scrub-fill'), time: card.querySelector('.time'), scrub: card.querySelector('.scrub'),
    };
    players.set(key, entry);
  }
  entry.ready = false;
  if (!YT || !target || !s.yt || !s.yt.length) { toSpotify(key); return; }
  const vars = { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, enablejsapi: 1 };
  if (location.protocol.startsWith('http')) vars.origin = location.origin;
  entry.player = new YT.Player(target, {
    width: '100%', height: '100%', videoId: s.yt[entry.idx], playerVars: vars,
    events: {
      onReady: () => {
        entry.ready = true;
        clearTimeout(entry.readyTimer);
        try { entry.player.setVolume(100); } catch { /* ignore */ }
        if (current === key) kick(key); // she asked for this song before the player was ready
      },
      onStateChange: (e) => onState(key, e),
      onError: () => onError(key),
    },
  });
  // A player that never reports ready is rebuilt, up to twice, before Spotify takes over.
  clearTimeout(entry.readyTimer);
  entry.readyTimer = setTimeout(() => { if (!entry.ready) rebuild(key); }, READY_TIMEOUT_MS);
}

function rebuild(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || entry.ready) return;
  entry.rebuilds += 1;
  try { if (entry.player) entry.player.destroy(); } catch { /* already gone */ }
  if (entry.rebuilds > 2) { toSpotify(key); return; }
  entry.card.querySelector('.sound-player').innerHTML = '<div class="sound-target"></div>';
  create(entry.card, YTapi);
}

/** Play the song for a page and fade out every other song. Call from a tap handler where you can. */
export function playPage(key) {
  if (!key) return;
  current = key;
  players.forEach((entry, k) => { if (k !== key) pauseEntry(entry, k); });
  const entry = players.get(key);
  if (!entry) return; // players are still being built; onReady will start it because current is set
  entry.userPaused = false; // opening a page means she wants its music
  if (entry.mode === 'spotify') { spotifyOn(entry.card.closest('.view')); return; }
  clearInterval(entry.fade);
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

function toggle(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.ready) return;
  current = key;
  clearInterval(entry.fade);
  if (isPlaying(entry)) { entry.userPaused = true; clearInterval(entry.watch); entry.player.pauseVideo(); return; }
  entry.userPaused = false;
  entry.vol = 100;
  entry.player.setVolume(100);
  entry.player.playVideo();
  watch(key);
}

/** Keep the progress bar and time in step with the open page's song. */
function tickProgress() {
  const entry = current && players.get(current);
  if (!wantsMusic(entry) || !isPlaying(entry)) return;
  try {
    const d = entry.player.getDuration();
    if (d) paintProgress(entry, entry.player.getCurrentTime(), d);
  } catch { /* player not ready */ }
}

/** Ask again for the open page's song if it should be playing and is not. */
function resume() {
  const entry = current && players.get(current);
  if (wantsMusic(entry) && !isPlaying(entry)) kick(current);
}

export function initMusic() {
  loadYouTubeApi().then((YT) => {
    YTapi = YT;
    document.querySelectorAll('.sound[data-song]').forEach((card) => create(card, YT));
    players.forEach((entry, key) => {
      bindControls(entry, {
        onToggle: () => toggle(key),
        onSeekTo: (f) => { if (wantsMusic(entry)) { const d = entry.player.getDuration(); if (d) entry.player.seekTo(f * d, true); } },
        onSeekBy: (s) => { if (wantsMusic(entry)) entry.player.seekTo(Math.max(0, entry.player.getCurrentTime() + s), true); },
      });
    });
    if (current) { const entry = players.get(current); if (entry && entry.ready) kick(current); } // asked for before the API loaded
    setInterval(tickProgress, 300);
  });

  // Inside a tap: a link to a page starts that page's song right away. Any other tap retries a song that is not
  // playing, unless she paused it herself.
  const onTap = (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    const key = a && PAGE_KEY[a.getAttribute('href').slice(1)];
    if (key) { playPage(key); return; }
    if (e.target.closest && e.target.closest('.sound [data-toggle], .scrub')) return; // her own play/pause choice
    resume();
  };
  ['pointerup', 'click', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, onTap, true));

  // Coming back to the tab, or to the page from the back button, tries again.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });
  window.addEventListener('pageshow', resume);
  window.addEventListener('focus', resume);

  // Turning the ambient music on pauses whichever song is playing.
  Sound.onChange((on) => {
    if (!on || !current) return;
    const entry = players.get(current);
    if (entry) pauseEntry(entry, current);
  });
}
