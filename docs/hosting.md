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

Each page has a Spotify player (iFrame API) that starts its song when the page opens and pauses when she leaves. Browsers allow sound only after she has tapped something, and tapping Enter on the opening screen and the dock both count. Some phones, iPhones especially, can still block it, and then the player's own play button is the fallback and a small hint appears.

Spotify plays the full track when she is signed in to Spotify in the same browser, and a 30 second preview otherwise. The players do not work inside sandboxed viewers that block iframes.

## Custom domain

Add a domain under the project's Domains settings in Vercel, then point its DNS at Vercel.
