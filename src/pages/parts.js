import { SONGS, spotifyUrl } from './songs.js';

// Small HTML builders used by every page.

export const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const playIcon = '<svg class="i-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
const pauseIcon = '<svg class="i-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';

const tonearm = `
  <svg class="arm" viewBox="0 0 100 140" aria-hidden="true">
    <g class="arm-pivot">
      <circle class="arm-base" cx="78" cy="16" r="11"/>
      <circle class="arm-dot" cx="78" cy="16" r="4"/>
      <path class="arm-bar" d="M78 16 V92 L58 118"/>
      <rect class="arm-head" x="49" y="112" width="18" height="11" rx="1" transform="rotate(32 58 117)"/>
    </g>
  </svg>`;

/** The soundtrack card: a record that spins while the real song plays. The YouTube player behind it stays out of sight. */
export function soundCard(key) {
  const s = SONGS[key];
  return `
    <div class="sound vinyl panel chamfer" data-song="${key}">
      <div class="deck">
        <button class="disc" type="button" data-toggle aria-label="Play or pause ${s.title}">
          <span class="record"><span class="label"><span class="label-mark script">C</span></span></span>
          ${tonearm}
        </button>
        <div class="deck-info">
          <span class="tag">Now playing</span>
          <span class="song">${s.title}</span>
          <span class="by">${s.by} · ${s.note}</span>
          <div class="transport">
            <button class="play-pause" type="button" data-toggle aria-label="Play or pause">${playIcon}${pauseIcon}</button>
            <div class="scrub" role="slider" tabindex="0" aria-label="Song position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="scrub-fill"></i></div>
            <span class="time">0:00</span>
          </div>
          <a class="open-link" href="${spotifyUrl(s)}" target="_blank" rel="noopener">Open in Spotify</a>
        </div>
      </div>
      <div class="sound-player"><div class="sound-target"></div></div>
      <p class="sound-hint" hidden>Tap anywhere to start the song.</p>
    </div>`;
}

export function codeBlock(file, id, initial = '') {
  return `
    <figure class="code panel">
      <figcaption><span>${file}</span><span>◆</span></figcaption>
      <pre><code id="${id}">${initial}</code></pre>
    </figure>`;
}

export function nextLink(href, label = 'Continue', primary = true) {
  return `<div class="next"><a class="btn${primary ? ' primary' : ''}" href="${href}">${label} ${arrow}</a></div>`;
}
