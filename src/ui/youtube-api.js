// Loads the YouTube iFrame API once. Resolves with the global YT object, or null if the script cannot load.
let loading = null;

export function loadYouTubeApi() {
  if (loading) return loading;
  loading = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    setTimeout(() => resolve(window.YT && window.YT.Player ? window.YT : null), 10000);
  });
  return loading;
}
