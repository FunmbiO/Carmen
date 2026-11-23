import { BufferGeometry, BufferAttribute } from 'three';

// Particle positions for the opening flower. Every particle has a start (scattered) and a target (on the flower).
const TAU = Math.PI * 2;
const GOLDEN = 2.39996323;
const rnd = (a, b) => a + Math.random() * (b - a);

export function buildFlowerGeometry(count) {
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4); // delay, swirl, size, phase

  const petals = 8;
  const layers = 5;
  const centre = Math.floor(count * 0.12);

  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (i < centre) {
      // Phyllotaxis in the middle, the same golden angle as the original flower.
      const j = i + 1;
      const r = 0.03 * Math.sqrt(j) * 1.0;
      x = r * Math.cos(j * GOLDEN);
      y = r * Math.sin(j * GOLDEN);
      z = 0.12;
    } else {
      const l = Math.floor(Math.pow(Math.random(), 0.8) * layers);
      const L = 1 - l * 0.17;
      const Wd = L * 0.4;
      const u = Math.pow(Math.random(), 0.8);
      const w = Wd * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85);
      // Weight some points to the petal edge so the outline reads.
      const edge = Math.random() < 0.38;
      const v = edge ? (Math.random() < 0.5 ? -1 : 1) : rnd(-1, 1);
      const px = v * w;
      const py = u * L;
      const a = (l * Math.PI) / petals + l * 0.18 + Math.floor(Math.random() * petals) * (TAU / petals);
      x = px * Math.cos(a) - py * Math.sin(a);
      y = px * Math.sin(a) + py * Math.cos(a);
      z = (l - 2) * 0.035 + rnd(-0.02, 0.02);
    }
    target[i * 3] = x; target[i * 3 + 1] = y; target[i * 3 + 2] = z;

    // Scattered start: a wide ring, so the dust spirals in from the edges.
    const phi = rnd(0, TAU);
    const R = rnd(1.8, 4.2);
    start[i * 3] = Math.cos(phi) * R;
    start[i * 3 + 1] = Math.sin(phi) * R * 0.75;
    start[i * 3 + 2] = rnd(-1.5, 1.5);

    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = Math.random();
    seed[i * 4 + 2] = Math.random();
    seed[i * 4 + 3] = Math.random();
  }

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(target, 3)); // required by three; the shader uses aTarget
  g.setAttribute('aTarget', new BufferAttribute(target, 3));
  g.setAttribute('aStart', new BufferAttribute(start, 3));
  g.setAttribute('aRand', new BufferAttribute(seed, 4));
  return g;
}
