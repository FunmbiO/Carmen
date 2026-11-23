import { SONGS, spotifyUrl } from './songs.js';

// Small HTML builders used by every page.

export const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

/** The soundtrack card. The real Spotify player sits in it and starts when the page opens. */
export function soundCard(key) {
  const s = SONGS[key];
  return `
    <div class="sound panel chamfer" data-song="${key}">
      <div class="sound-top">
        <div class="sound-l"><span class="tag">Now playing</span><span class="song">${s.title}</span><span class="by">${s.by} · ${s.note}</span></div>
        <a class="btn" href="${spotifyUrl(s)}" target="_blank" rel="noopener">Open in Spotify</a>
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
