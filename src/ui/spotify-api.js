// Loads Spotify's iFrame API once. Resolves with the API object, or null if the script cannot load.
let loading = null;

export function loadSpotifyApi() {
  if (loading) return loading;
  loading = new Promise((resolve) => {
    if (window.__spotifyIframeApi) { resolve(window.__spotifyIframeApi); return; }
    window.onSpotifyIframeApiReady = (api) => { window.__spotifyIframeApi = api; resolve(api); };
    const s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    setTimeout(() => resolve(window.__spotifyIframeApi || null), 8000);
  });
  return loading;
}
