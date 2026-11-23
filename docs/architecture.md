# Architecture

## Flow

`index.html` holds the frame (top bar, four empty `<section>` views, dock). `src/main.js` mounts each page into its section, then plays the intro for first visits and starts the router.

## Pages

Each page folder in `src/pages/` has `markup.js` (HTML string), `scene.js` (canvas drawing) and `index.js` (wiring). A scene is an object with four methods:

```js
{ enter() {}, leave() {}, resize() {}, draw(now, dt) {} }
```

`registerPage(name, { scene })` in `src/ui/router.js` adds it. The router shows the section matching the hash and calls `draw` once per frame for the current page only. Drawing pauses while the tab is hidden.

## The 3D bouquet

The Bloom page is a bouquet built in Three.js, loaded on first visit so it stays out of the main bundle (`src/pages/bloom/`). `flowers3d.js` builds the roses, daisies and tulips from bent petals; the daisy centre is dots on the same golden angle as the original code flower. `wrap3d.js` is the kraft paper and ribbon bow. `effects3d.js` is the gold dust and falling petals. `bouquet3d.js` puts it together: lights, orbit controls (drag to turn, no zoom so the page can still scroll), tap detection, and the page's extras (bloom again, add a flower up to 16, let the petals go, and save a snapshot as a postcard image). Colours follow the active theme. If WebGL is unavailable, the page shows a short note and the rest still works.

## Intro

`src/intro/` builds about 9,500 points (5,200 on phones), each with a scattered start and a target on the flower. A vertex shader moves them between the two; GSAP drives `uProgress` and `uExplode`. The intro is loaded with a dynamic import so Three.js is not part of the main bundle.

## Audio

`src/audio/engine.js` is a thin facade. `tone-engine.js` builds the Tone.js chain (filter, reverb, compressor) and runs a 16-step pattern per mood from `moods.js`, using the voices in `voices.js`. It is preloaded when the browser is idle and started by a click, because browsers require a gesture.

## Builds

`npm run build` splits Three.js, Tone.js and GSAP into their own chunks. `npm run build:single` inlines everything, fonts included, into one HTML file of about 2 MB that works from disk.
