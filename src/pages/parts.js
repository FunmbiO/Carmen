// Small HTML builders used by every page.

export const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

export function soundCard(song, by, query) {
  return `
    <div class="sound panel chamfer tilt">
      <div class="sound-l"><span class="tag">Soundtrack</span><span class="song">${song}</span><span class="by">${by}</span></div>
      <a class="btn" href="https://open.spotify.com/search/${encodeURIComponent(query)}" target="_blank" rel="noopener">Open in Spotify</a>
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
