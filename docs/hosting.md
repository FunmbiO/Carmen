# Hosting

The site is a static Vite build hosted on Vercel and connected to this GitHub repo. Every push to `main` deploys to production, and other branches get preview URLs.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output | `dist` |
| Node | 22 |

The site asks search engines not to index it (`robots.txt`, a meta tag and an `X-Robots-Tag` header), because it is a private gift.

## Songs

Each page's real song plays from a YouTube player that stays out of sight behind a vinyl record card (`src/ui/music.js`, `src/styles/vinyl.css`). The record spins and the tonearm lowers while it plays. The play button, progress line and seeking all drive the hidden player. YouTube's terms prefer a visible player, which is a small risk on a private site; if that matters, make `.sound-player` visible in `vinyl.css`.

Browsers only allow sound that starts inside a tap, so the opening begins with a "Tap to begin" screen. That tap starts "Whatever She Wants" under the opening. Enter fades it into the first page's song, and every link to a page starts that page's song in the same tap and fades the last one out. Any other tap retries a blocked song, and a short hint asks for a tap if nothing has started after four seconds.

The YouTube ids for each song live in `src/pages/songs.js`. If a video blocks embedding, the next id in its list is tried, and if all of them fail that page switches to the Spotify player.

Pages that are not open stay rendered but out of sight (`.view[hidden]` in `layout.css`), because a player inside a `display: none` page may not start.

## Custom domain

Add a domain under the project's Domains settings in Vercel, then point its DNS at Vercel.
