import { SONGS } from '../pages/songs.js';
import { loadYouTubeApi } from './youtube-api.js';
import { activateSong as spotifyOn, deactivateSong as spotifyOff } from './song-player.js';
import { ramp } from './music/fade.js';
import { setHint, setPlayingClass, paintProgress, bindControls } from './music/view.js';

// Each page's real song, played by a YouTube player that stays hidden behind the vinyl card. The opening has its own
// hidden player, so its song can differ from the last page's.
//
// Browsers only allow sound that starts inside a tap, so playback is started from inside the tap itself: the first
// tap, Enter, and every link to a page. The opening waits for its player to be ready before it lets her tap.
//
// Reliability rules, because a missed start is the worst failure here:
//  - Whether a song is playing is read from the player (getPlayerState), never from a flag that can go stale.
//  - Asking for a song is never dropped: if the player is not ready yet it starts the moment it is.
//  - A song that has been asked for is retried every half second until it plays. After three seconds a hint
//    asks for a tap, and any tap anywhere retries it inside that tap.
//  - A player that never becomes ready is rebuilt, and only then replaced by the Spotify player.
//  - Nothing fails quietly: every failure path is guarded, falls back, and is logged.
//
// To keep a phone light, only the open page's player and its neighbours exist at once (and the opening's until she
// has entered). The rest are taken down after their song has faded out, and rebuilt on demand.

const PAGES = ['bloom', 'bouquet', 'golden', 'dark'];
const PAGE_KEY = { bloom: 'bloom', bouquet: 'bouquet', 'golden-hour': 'golden', 'after-dark': 'dark' };
const FADE_MS = 900;
const READY_TIMEOUT_MS = 8000;
const players = new Map(); // song key -> entry
const cards = new Map(); // song key -> the card element that holds its player
let current = null;
let YTapi = null;
let apiFailed = false;
let introAlive = true;
let settleTimer = 0;

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

const viewOf = (entry) => entry.card.closest('.view'); // null for the opening's card

function pauseEntry(entry, key) {
  if (entry.mode === 'spotify') { const v = viewOf(entry); if (v) spotifyOff(v); return; }
  clearInterval(entry.watch);
  if (!entry.ready || !entry.player) return;
  if (!isPlaying(entry)) { try { entry.player.pauseVideo(); } catch { /* the player is going away */ } return; }
  // Fade out, then pause, unless she has come back to this song in the meantime.
  ramp(entry, 0, FADE_MS, () => {
    if (current === key) return;
    try { entry.player.pauseVideo(); entry.player.setVolume(100); } catch { /* the player is going away */ }
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
    if (current !== key || entry.userPaused || entry.mode !== 'yt' || !entry.player) { clearInterval(entry.watch); return; }
    if (isPlaying(entry)) { clearInterval(entry.watch); setHint(entry.card, false); return; }
    n += 1;
    try { entry.player.playVideo(); } catch (err) { if (n === 1) console.warn('The music player did not accept play', err); }
    if (n === 6) setHint(entry.card, true);
    if (n >= 60) clearInterval(entry.watch); // give up after 30 seconds; a tap still retries
  }, 500);
}

/** Ask for the song. Safe to call any number of times. */
function kick(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.ready || !entry.player) return; // onReady asks again
  if (isPlaying(entry)) { ramp(entry, 100, FADE_MS); watch(key); return; }
  try {
    entry.vol = 0;
    entry.player.setVolume(0);
    entry.player.playVideo();
  } catch { /* the watch loop retries */ }
  ramp(entry, 100, FADE_MS);
  watch(key);
}

/** Take a page's player down, ready to be built again later. */
function release(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.player) return;
  clearInterval(entry.fade);
  clearInterval(entry.watch);
  clearTimeout(entry.readyTimer);
  entry.gen += 1; // anything the old player still reports is ignored
  try { entry.player.destroy(); } catch { /* already gone */ }
  entry.player = null;
  entry.ready = false;
  entry.vol = 100;
  entry.card.querySelector('.sound-player').innerHTML = '<div class="sound-target"></div>';
  setPlayingClass(entry.card, false);
  setHint(entry.card, false);
}

/** Last resort: swap this card to the Spotify player. The opening has none, so it simply goes without. */
function toSpotify(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt') return;
  console.warn(`The ${key} song could not be played from YouTube.`);
  clearInterval(entry.fade);
  clearInterval(entry.watch);
  clearTimeout(entry.readyTimer);
  entry.gen += 1;
  try { if (entry.player) entry.player.destroy(); } catch { /* already gone */ }
  entry.player = null;
  entry.ready = false;
  entry.card.querySelector('.sound-player').innerHTML = '<div class="sound-target"></div>';
  setPlayingClass(entry.card, false);
  setHint(entry.card, false);
  if (!viewOf(entry)) { entry.mode = 'none'; return; }
  entry.mode = 'spotify';
  entry.card.classList.add('spotify');
  if (current === key) spotifyOn(viewOf(entry));
}

function onState(key, e) {
  const entry = players.get(key);
  if (!entry || !YTapi) return;
  const S = YTapi.PlayerState;
  if (e.data === S.PLAYING) {
    if (current !== key) { try { entry.player.pauseVideo(); } catch { /* the player is going away */ } return; }
    setPlayingClass(entry.card, true);
    setHint(entry.card, false);
  } else if (e.data === S.PAUSED) {
    setPlayingClass(entry.card, false);
  } else if (e.data === S.ENDED) {
    setPlayingClass(entry.card, false);
    if (current === key) { try { entry.player.seekTo(0, true); entry.player.playVideo(); } catch { /* the watch loop picks it up */ } } // loop
  }
}

function onError(key) {
  const entry = players.get(key);
  if (!entry || !entry.player) return;
  const id = SONGS[key].yt[entry.idx];
  // Only act on errors from the video we are on. A video we already moved past can still report late.
  try {
    const vid = entry.player.getVideoData && entry.player.getVideoData().video_id;
    if (vid && vid !== id) return;
  } catch { /* no video data yet */ }
  if (entry.handledIdx === entry.idx) return; // one failed video can report twice
  entry.handledIdx = entry.idx;
  const next = SONGS[key].yt[entry.idx + 1];
  try {
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
  } catch (err) {
    console.error('The music player failed while moving to a backup video', err);
    toSpotify(key);
  }
}

/** The record for one song: its card, the state of its player, and its controls. Made once, then reused. */
function makeEntry(key) {
  const card = cards.get(key);
  const entry = {
    player: null, ready: false, userPaused: false, idx: 0, mode: 'yt', watch: 0, fade: 0, vol: 100, rebuilds: 0, gen: 0, card,
    fill: card.querySelector('.scrub-fill'), time: card.querySelector('.time'), scrub: card.querySelector('.scrub'),
  };
  players.set(key, entry);
  bindControls(entry, {
    onToggle: () => toggle(key),
    onSeekTo: (f) => { if (wantsMusic(entry)) { const d = entry.player.getDuration(); if (d) entry.player.seekTo(f * d, true); } },
    onSeekBy: (sec) => { if (wantsMusic(entry)) entry.player.seekTo(Math.max(0, entry.player.getCurrentTime() + sec), true); },
  });
  return entry;
}

/** Build a song's YouTube player if it does not have one. */
function ensure(key) {
  if (!cards.has(key)) return null;
  const entry = players.get(key) || makeEntry(key);
  if (entry.mode !== 'yt' || entry.player) return entry;
  if (!YTapi) { if (apiFailed) toSpotify(key); return entry; }
  const s = SONGS[key];
  const target = entry.card.querySelector('.sound-target');
  if (!target || !s.yt || !s.yt.length) { toSpotify(key); return entry; }
  entry.gen += 1;
  const token = entry.gen;
  entry.ready = false;
  const vars = { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, enablejsapi: 1 };
  if (location.protocol.startsWith('http')) vars.origin = location.origin;
  try {
    entry.player = new YTapi.Player(target, {
      width: '100%', height: '100%', videoId: s.yt[entry.idx], playerVars: vars,
      events: {
        onReady: () => {
          if (token !== entry.gen) return;
          entry.ready = true;
          clearTimeout(entry.readyTimer);
          try { entry.player.setVolume(100); } catch { /* ignore */ }
          if (current === key) kick(key); // she asked for this song before the player was ready
        },
        onStateChange: (e) => { if (token === entry.gen) onState(key, e); },
        onError: () => { if (token === entry.gen) onError(key); },
      },
    });
  } catch (err) {
    console.error(`The ${key} music player could not be built`, err);
    entry.player = null;
    toSpotify(key);
    return entry;
  }
  // A player that never reports ready is rebuilt, up to twice, before Spotify takes over.
  clearTimeout(entry.readyTimer);
  entry.readyTimer = setTimeout(() => { if (token === entry.gen && !entry.ready) rebuild(key); }, READY_TIMEOUT_MS);
  return entry;
}

function rebuild(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || entry.ready) return;
  entry.rebuilds += 1;
  console.warn(`The ${key} music player was slow to start, rebuilding it (${entry.rebuilds}).`);
  if (entry.rebuilds > 2) { toSpotify(key); return; }
  release(key);
  ensure(key);
}

/** Which songs should have a player right now. */
function wanted(key) {
  const want = new Set();
  if (introAlive) want.add('intro');
  const i = PAGES.indexOf(key);
  if (i < 0) { want.add('bloom'); return want; }
  want.add(key);
  if (PAGES[i - 1]) want.add(PAGES[i - 1]);
  if (PAGES[i + 1]) want.add(PAGES[i + 1]);
  return want;
}

/** After a page change: build the neighbours (one at a time) and take down the players nobody needs. */
function settle() {
  const want = wanted(current || 'bloom');
  [...want].forEach((k, i) => setTimeout(() => ensure(k), i * 500));
  players.forEach((entry, k) => {
    if (want.has(k) || k === current || entry.mode !== 'yt' || !entry.player) return;
    if (isPlaying(entry)) return; // still fading out; the next page change will look again
    release(k);
  });
}
function scheduleSettle() {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settle, 1400);
}

/** Play the song for a page and fade out every other song. Call from a tap handler where you can. */
export function playPage(key) {
  if (!key) return;
  current = key;
  players.forEach((entry, k) => { if (k !== key) pauseEntry(entry, k); });
  const entry = YTapi || apiFailed ? ensure(key) : players.get(key);
  scheduleSettle();
  if (!entry) return; // the music is still loading; onReady will start it because current is set
  entry.userPaused = false; // opening a page means she wants its music
  if (entry.mode === 'spotify') { const v = viewOf(entry); if (v) spotifyOn(v); return; }
  clearInterval(entry.fade);
  kick(key);
}

/** Resolves true when a song's player is ready to play, or false if it fails or takes longer than `ms`. */
export function whenReady(key, ms = 7000) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      const e = players.get(key);
      if (e && e.ready) return resolve(true);
      if (apiFailed || (e && e.mode !== 'yt')) return resolve(false);
      if (performance.now() - t0 > ms) return resolve(false);
      setTimeout(tick, 100);
      return undefined;
    };
    tick();
  });
}

/** Call once she has entered: the opening's player is no longer needed. */
export function releaseIntro() {
  introAlive = false;
  setTimeout(() => release('intro'), 1600);
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
  if (!entry || entry.mode !== 'yt' || !entry.ready || !entry.player) return;
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
  if (!wantsMusic(entry) || !entry.fill || !isPlaying(entry)) return;
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
  document.querySelectorAll('.sound[data-song]').forEach((c) => cards.set(c.dataset.song, c));

  loadYouTubeApi().then((YT) => {
    YTapi = YT;
    apiFailed = !YT;
    if (!YT) console.warn('YouTube could not be loaded, so the pages fall back to Spotify.');
    // Build the players one after another, not all at once. The opening's and the first page's come first.
    const want = current ? wanted(current) : new Set(['intro', 'bloom']);
    [...want].forEach((k, i) => setTimeout(() => ensure(k), i * 400));
    setInterval(tickProgress, 300);
  }).catch((err) => {
    console.error('The music could not start', err);
    apiFailed = true;
    cards.forEach((c, k) => { if (k !== 'intro') { ensure(k); } });
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
}
