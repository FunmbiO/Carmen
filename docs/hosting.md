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

The in-page players are Spotify embeds, so they work on the hosted site but not inside sandboxed viewers that block iframes. Spotify plays the full track when she is signed in to Spotify in the same browser, and a 30 second preview otherwise.

## Custom domain

Add a domain under the project's Domains settings in Vercel, then point its DNS at Vercel.
