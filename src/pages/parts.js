import { SONGS, spotifyUrl } from './songs.js';

// Small HTML builders used by every page.

export const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const play = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

/** The soundtrack card. "Play the song" swaps in the real Spotify player; the link opens the same track. */
export function soundCard(key) {
  const s = SONGS[key];
  return `
    <div class="sound panel chamfer tilt" data-song="${key}">
      <div class="sound-l"><span class="tag">Soundtrack</span><span class="song">${s.title}</span><span class="by">${s.by} · ${s.note}</span></div>
      <div class="sound-actions">
        <button class="btn primary" type="button" data-play>${play} Play the song</button>
        <a class="btn" href="${spotifyUrl(s)}" target="_blank" rel="noopener">Open in Spotify</a>
      </div>
      <div class="sound-player" hidden></div>
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
