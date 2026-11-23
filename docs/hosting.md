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

Each page has the real song in a YouTube player, kept visible in the page's sound card. Browsers only allow sound that starts inside a tap, so all four players are built while the opening screen plays and each song is started from inside the tap itself: Enter on the opening screen, and every link to a page. Any other tap retries a song that was blocked, and a short hint asks for a tap if nothing has started after four seconds.

The YouTube ids for each song live in `src/pages/songs.js`. If a video blocks embedding, the next id in its list is tried, and if all of them fail that page switches to the Spotify player.

Pages that are not open stay rendered but out of sight (`.view[hidden]` in `layout.css`), because a player inside a `display: none` page may not start.

## Custom domain

Add a domain under the project's Domains settings in Vercel, then point its DNS at Vercel.
