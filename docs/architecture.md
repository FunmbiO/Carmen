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

The Bloom page is a bouquet built by hand in Three.js, loaded on first visit so it stays out of the main bundle (`src/pages/bloom/`).

- `flowers3d.js`: roses, peonies, daisies, sunflowers and tulips. Every petal of a flower is merged into one mesh, and the bud-to-bloom change is a morph target, so a whole flower is a single draw call. Petals are shaded base to tip by vertex colour, with frilled edges, and the material has a velvet sheen and a faint inner glow.
- `fillers3d.js`: lavender spikes, hydrangea clusters, baby's breath, silver eucalyptus and a collar of long leaves, each kind merged into one mesh.
- `plan3d.js` and `layout3d.js`: what goes in the bouquet and where. About half the flowers are roses, in classic rose colours, with peonies, daisies, tulips and a sunflower among them. Each head is treated as a sphere and the spheres are pushed apart on a dome until they only just touch, so neighbouring petals do not pierce each other and crowded flowers settle into a second layer. If they cannot all fit, every flower shrinks a little and the layout runs again. Extra flowers go in the roomiest gap. Heads face outward from the dome. `dev/layout-check.mjs` checks the result in Node. The bouquet holds up to 40 flowers.
- `colors3d.js`: the vivid palette. The flowers do not follow the theme, so they stay bright on any page; the paper and ribbon do follow it.
- `wrap3d.js`: the coloured paper cone with a cream lining, and the satin ribbon bow.
- `effects3d.js`: gold dust when a flower is tapped, falling petals, and drifting glow motes.
- `cinema3d.js`: the opening shot. A low close camera arcs round and pulls back while the light rises and the flowers burst up and open, about five seconds, with letterbox bars and a title card on the stage. A tap skips it, and "Bloom again" replays it.
- `bouquet3d.js`: puts it together with lights (warm key and fill, cool rim), neutral tone mapping so saturated colours stay saturated, orbit controls (drag to turn, no zoom so the page can still scroll), tap detection, and the extras: add a flower up to 44, let the petals go, and save a snapshot as a postcard image.

The stage is dark in every theme (`--cine-deep` and `--cine-glow` in `tokens.css`) so the colours stand out. The scene draws about 100 calls and 220,000 triangles. If WebGL is unavailable, the page shows a short note and the rest still works. Add `?debug` to the address to expose the scene as `window.__bouquet` for stepping it in tests.

## Intro

`src/intro/` builds about 9,500 points (5,200 on phones), each with a scattered start and a target on the flower. A vertex shader moves them between the two; GSAP drives `uProgress` and `uExplode`. The intro is loaded with a dynamic import so Three.js is not part of the main bundle.

## Audio

`src/audio/engine.js` is a thin facade. `tone-engine.js` builds the Tone.js chain (filter, reverb, compressor) and runs a 16-step pattern per mood from `moods.js`, using the voices in `voices.js`. It is preloaded when the browser is idle and started by a click, because browsers require a gesture.

## Builds

`npm run build` splits Three.js, Tone.js and GSAP into their own chunks. `npm run build:single` inlines everything, fonts included, into one HTML file of about 2 MB that works from disk.
