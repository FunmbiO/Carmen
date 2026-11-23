# Design

## Themes

Three palettes share one set of CSS tokens (`src/styles/tokens.css`). The switcher in the top bar sets `data-theme` on `<html>` and the choice is remembered.

| Theme | Ground | Accent | Feel |
| --- | --- | --- | --- |
| Noir | `#07090A` with emerald glow | gold `#E7C26A` | jewel box at night |
| Terracotta | `#1C110B` | honey `#E9A93B` | golden hour |
| Ivory (default) | `#F6EFE3` | bordeaux `#5A1624`, antique gold | fashion editorial, the only light theme |

Canvas scenes cannot read CSS tokens cheaply, so `src/lib/theme.js` holds matching palettes (`palette()`) with hue shifts for the flowers, sky and ground colours, and glow colours.

## Type

| Role | Face |
| --- | --- |
| Her name and signature | Pinyon Script |
| Headings and quotes | Bodoni Moda (variable, italic) |
| Body and buttons | Instrument Sans |
| Code and labels | DM Mono |

All fonts are self-hosted through Fontsource.

## Shape language

Square corners by default. Feature panels use a chamfered corner (`.chamfer`). Canvases get a double hairline frame (`.frame`). The bouquet window is the one arch. Round shapes are kept for dots and the wax seal.
