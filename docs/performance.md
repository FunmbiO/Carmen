# Performance

What keeps the site smooth, especially on phones, and how to check it.

## What is done

| Area | What | Why |
| --- | --- | --- |
| Off-screen work | Every canvas scene stops drawing while it is scrolled out of view (`src/lib/visible.js`, checked in `src/ui/router.js`). | A scrolled-away bouquet cost 100+ GPU draw calls a frame for nothing. Measured: 0 calls when away. |
| Frame rate | The 2D scenes ask for a 30 fps cap on touch screens (`maxFps`). The 3D bouquet is not capped. | Half the redraws, so less heat and battery. |
| Resolution | The bouquet starts at the sharpest the screen can show (capped at 1.75x on phones), steps down a quarter when frames run longer than 30 ms, and creeps back up when they are comfortably fast. | A slow device gets a slightly softer bouquet instead of a stuttering one. |
| 3D weight | Petals, fillers and centres use fewer segments; the bouquet went from about 222,000 to 128,000 triangles. Each flower is one mesh and blooms by morphing. | Fewer vertices to shade every frame. |
| Touch screens | No blend-mode grain layer, no live backdrop blur on the bars, and no smooth-scroll engine. | Blend modes and blur over an animated canvas force the GPU to re-composite every frame. |
| Dust | Fewer particles, lower frame cap, and it rests (fades out and pauses) while the 3D bouquet is open. | The GPU is busiest there. |
| Music players | The four YouTube players are built one after another, the opening song and first page first. | Four players loading at once is a spike that makes a phone stutter. |
| Loading | Three.js and GSAP are separate chunks; the intro and the bouquet load on demand; the connection to YouTube is warmed up early. | A smaller first load. |

## Checks

- `node dev/layout-check.mjs`: the bouquet layout fits without crushing the flowers.
- `node dev/music-reliability.cjs` and `node dev/touch-surfaces.cjs`: need Playwright and the built site on port 4173.
- Add `?debug` to the address and call `window.__bouquet.stats()` in the console for draw calls, triangles and the current pixel ratio.
