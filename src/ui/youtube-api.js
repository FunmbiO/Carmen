// Loads the YouTube iFrame API once. Resolves with the global YT object, or null if it cannot be loaded.
// A slow or dropped download is retried before giving up, because a failed load means no autoplay at all.
const ATTEMPTS = 3;
const TIMEOUT_MS = 9000;
let loading = null;

export function loadYouTubeApi() {
  if (loading) return loading;
  loading = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    let done = false;
    let attempts = 0;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); finish(window.YT); };

    const attempt = () => {
      if (done) return;
      attempts += 1;
      let settled = false;
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api' + (attempts > 1 ? `?retry=${attempts}` : '');
      s.async = true;
      const fail = () => {
        if (settled || done) return;
        settled = true;
        s.remove();
        if (attempts >= ATTEMPTS) { finish(window.YT && window.YT.Player ? window.YT : null); return; }
        setTimeout(attempt, 1500);
      };
      s.onerror = fail;
      document.head.appendChild(s);
      setTimeout(() => { if (!(window.YT && window.YT.Player)) fail(); }, TIMEOUT_MS);
    };
    attempt();
  });
  return loading;
}
