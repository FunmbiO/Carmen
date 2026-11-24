import { Color, SRGBColorSpace } from 'three';

// The bouquet's colours are vivid and do not follow the theme, so they stay bright on any page.
// Each entry is hue (degrees), saturation, lightness, read as sRGB so the colour on screen matches the number.
export const VIVID = {
  blush: [345, 0.72, 0.82],
  crimson: [352, 0.9, 0.5],
  sun: [47, 0.98, 0.56],
  hotpink: [330, 0.9, 0.6],
  cream: [48, 0.6, 0.92],
  orange: [27, 0.97, 0.57],
  coral: [10, 0.93, 0.64],
  magenta: [312, 0.85, 0.55],
  lavender: [268, 0.62, 0.74],
  peach: [22, 0.88, 0.78],
  violet: [282, 0.7, 0.5],
  wine: [345, 0.75, 0.36],
};

// Stepping through this list by 7 keeps neighbouring flowers different colours.
export const COLOR_ORDER = ['blush', 'crimson', 'sun', 'hotpink', 'cream', 'orange', 'coral', 'magenta', 'lavender', 'peach', 'violet', 'wine'];

export function hsl(h, s, l) {
  return new Color().setHSL(((h % 360) + 360) % 360 / 360, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l)), SRGBColorSpace);
}

export function vivid(name) {
  const [h, s, l] = VIVID[name];
  return hsl(h, s, l);
}
