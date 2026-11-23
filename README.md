# Carmen

A small gift, built in code. It opens with a cinematic "Hey Carmen", then walks through four pages: a flower that blooms, a bouquet of seven, a sunset you can drag, and a letter.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # multi-file build in dist/
npm run build:single   # one self-contained HTML file in dist-single/
```

Open `/dev/lab.html` while the dev server runs to preview the flower engine in all three themes.

Add `?intro=0` to the address, or open a page directly such as `#bouquet`, to skip the opening screen.

## What is in it

| Area | Where |
| --- | --- |
| Opening screen (Three.js particles, GSAP timeline) | `src/intro/` |
| The four pages | `src/pages/` |
| Flower, stem and ambience drawing | `src/lib/` |
| Music (Tone.js) | `src/audio/` |
| Router, dock, scroll, cursor, effects | `src/ui/` |
| Themes and styles | `src/lib/theme.js`, `src/styles/` |

More detail: [design](docs/design.md), [architecture](docs/architecture.md), [hosting](docs/hosting.md), [credits](docs/credits.md).

## Git

Work is done on short branches with standard prefixes (`feat/`, `chore/`, `style/`, `perf/`, `docs/`), merged into `main` with a merge commit. `legacy/carmens-flower.html` is the original single-file version, kept for reference.
