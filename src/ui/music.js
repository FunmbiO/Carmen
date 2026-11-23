import { SONGS } from '../pages/songs.js';
import { Sound } from '../audio/engine.js';
import { loadYouTubeApi } from './youtube-api.js';
import { activateSong as spotifyOn, deactivateSong as spotifyOff } from './song-player.js';

// Each page's real song, played by a YouTube player that stays hidden behind the vinyl card.
//
// Browsers only allow sound that starts inside a tap. So every player is built up front, while the opening screen
// plays, and playback is started from inside the tap itself: the first tap, Enter, and every link to a page.
// If a video blocks embedding, the next candidate is tried, and the last resort is the Spotify player.

const PAGE_KEY = { bloom: 'bloom', bouquet: 'bouquet', 'golden-hour': 'golden', 'after-dark': 'dark' };
const FADE_MS = 900;
const players = new Map(); // song key -> entry
let current = null;
let YTapi = null;

function setHint(card, show) {
  const hint = card.querySelector('.sound-hint');
  if (hint) hint.hidden = !show;
}

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function setPlaying(entry, on) {
  entry.playing = on;
  entry.card.classList.toggle('is-playing', on);
}

/** Ramp the player volume. Phones that ignore volume simply skip the fade. */
function ramp(entry, to, ms, done) {
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

function pauseEntry(entry, key) {
  if (entry.mode === 'spotify') { spotifyOff(entry.card.closest('.view')); return; }
  clearTimeout(entry.timer);
  if (!entry.ready) return;
  if (!entry.playing) { try { entry.player.pauseVideo(); } catch { /* ignore */ } return; }
  // Fade out, then pause, unless she has come back to this song in the meantime.
  ramp(entry, 0, FADE_MS, () => {
    if (current === key) return;
    try { entry.player.pauseVideo(); entry.player.setVolume(100); } catch { /* ignore */ }
    entry.vol = 100;
  });
}

/** Start the song, and if it has not begun a few seconds later, ask for a tap. */
function kick(key) {
  const entry = players.get(key);
  if (!entry || entry.mode !== 'yt' || !entry.ready) return;
  const now = Date.now();
  if (now - (entry.lastKick || 0) < 500) return; // the tap and the page opening both ask; once is enough
  entry.lastKick = now;
  try {
    entry.vol = 0;
    entry.player.setVolume(0);
    entry.player.playVideo();
  } catch { /* retried on the next tap */ }
  ramp(entry, 100, FADE_MS);
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => { if (current === key && !entry.started) setHint(entry.card, true); }, 4000);
}

/** Last resort: swap this card to the Spotify player. */
function toSpotify(key) {
  const entry = players.get(key);
  if (!entry || entry.mode === 'spotify') return;
  entry.mode = 'spotify';
  clearInterval(entry.fade);
  try { if (entry.player) entry.player.destroy(); } catch { /* already gone */ }
  entry.card.querySelector('.sound-player').innerHTML = '<div class="sound-target"></div>';
  entry.card.classList.add('spotify');
  setPlaying(entry, false);
  setHint(entry.card, false);
  if (current === key) spotifyOn(entry.card.closest('.view'));
}

function onState(key, e) {
  const entry = players.get(key);
  if (!entry || !YTapi) return;
  const S = YTapi.PlayerState;
  if (e.data === S.PLAYING) {
    if (current !== key) { try { entry.player.pauseVideo(); } catch { /* ignore */ } return; }
    entry.started = true;
    setPlaying(entry, true);
    clearTimeout(entry.timer);
    setHint(entry.card, false);
    Sound.stop(); // the ambient music steps aside for the real song
  } else if (e.data === S.PAUSED) {
    setPlaying(entry, false);
  } else if (e.data === S.ENDED) {
    setPlaying(entry, false);
    if (current === key) { try { entry.player.seekTo(0, true); entry.player.playVideo(); } catch { /* ignore */ } } // loop
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
  // Only the open page may start playing; the others just line up the next video.
  if (current === key) entry.player.loadVideoById(next);
  else entry.player.cueVideoById(next);
}

function create(card, YT) {
  const key = card.dataset.song;
  const s = SONGS[key];
  const target = card.querySelector('.sound-target');
  const entry = {
    player: null, ready: false, started: false, playing: false, idx: 0, mode: 'yt', timer: 0, fade: 0, vol: 100, card,
    fill: card.querySelector('.scrub-fill'), time: card.querySelector('.time'), scrub: card.querySelector('.scrub'),
  };
  players.set(key, entry);
  if (!YT || !target || !s.yt || !s.yt.length) { toSpotify(key); return; }
  const vars = { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, enablejsapi: 1 };
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

/** Play the song for a page, and fade out every other song. Call from a tap handler where you can. */
export function playPage(key) {
  if (!key) return;
  current = key;
  players.forEach((entry, k) => { if (k !== key) pauseEntry(entry, k); });
  const entry = players.get(key);
  if (!entry) return;
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
  if (entry.playing) { entry.player.pauseVideo(); return; }
  entry.vol = 100;
  entry.player.setVolume(100);
  entry.player.playVideo();
}

function seekBy(entry, fraction) {
  const d = entry.player.getDuration && entry.player.getDuration();
  if (d) entry.player.seekTo(Math.max(0, Math.min(1, fraction)) * d, true);
}

function bindControls() {
  players.forEach((entry, key) => {
    entry.card.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => toggle(key)));
    if (!entry.scrub) return;
    entry.scrub.addEventListener('click', (e) => {
      if (entry.mode !== 'yt' || !entry.ready) return;
      const r = entry.scrub.getBoundingClientRect();
      seekBy(entry, (e.clientX - r.left) / r.width);
    });
    entry.scrub.addEventListener('keydown', (e) => {
      if (entry.mode !== 'yt' || !entry.ready || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      entry.player.seekTo(Math.max(0, entry.player.getCurrentTime() + (e.key === 'ArrowRight' ? 10 : -10)), true);
    });
  });
}

/** Keep the progress bar and time in step with the open page's song. */
function tickProgress() {
  const entry = current && players.get(current);
  if (!entry || entry.mode !== 'yt' || !entry.ready || !entry.playing) return;
  try {
    const d = entry.player.getDuration();
    const t = entry.player.getCurrentTime();
    if (!d) return;
    const frac = Math.min(1, t / d);
    entry.fill.style.width = (frac * 100).toFixed(2) + '%';
    entry.time.textContent = fmt(t);
    entry.scrub.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
  } catch { /* player not ready */ }
}

export function initMusic() {
  loadYouTubeApi().then((YT) => {
    YTapi = YT;
    document.querySelectorAll('.sound[data-song]').forEach((card) => create(card, YT));
    bindControls();
    setInterval(tickProgress, 300);
  });

  // Inside a tap: a link to a page starts that page's song right away. Any other tap retries a blocked song.
  const onTap = (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    const key = a && PAGE_KEY[a.getAttribute('href').slice(1)];
    if (key) { playPage(key); return; }
    if (e.target.closest && e.target.closest('.sound [data-toggle], .scrub')) return; // her own play/pause choice
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
