import {
  Float32BufferAttribute, PlaneGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, DoubleSide,
  SphereGeometry, Matrix4, Color,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Hand-built flower heads. Every head faces +Y with its centre at the origin and exposes setOpen(0..1).
// All the petals of a flower are merged into ONE mesh, and the bud-to-bloom change is a morph target, so a whole
// flower costs a single draw call however many petals it has.

const TAU = Math.PI * 2;
const GOLDEN = 2.39996323;
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A bent petal. Base at the origin, tip along +y, the bowl faces +z. Negative curl closes it inward. */
export function petalGeometry(length, width, curl, cup = 0.5, segY = 8, segX = 6, ruffle = 0) {
  const g = new PlaneGeometry(1, 1, segX, segY);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + 0.5) * 2 - 1; // -1..1 across
    const t = pos.getY(i) + 0.5; // 0..1 base to tip
    const tt = Math.pow(t, 0.8);
    const half = Math.pow(Math.max(0, 1 - Math.pow(2 * tt - 1, 2)), 0.36); // narrow base, broad rounded tip
    const x = u * half * width * 0.5;
    const y = t * length;
    // Frilly edges: a wave that grows toward the rim and the tip.
    const frill = ruffle * width * 0.14 * Math.sin(u * 5 + t * 8) * Math.pow(Math.abs(u), 1.4) * t;
    const z = curl * length * t * t + cup * width * 0.5 * u * u * half + frill;
    pos.setXYZ(i, x, y, z);
    let shade = 0.5 + 0.5 * Math.pow(t, 0.9); // darker at the base, full colour at the tip
    shade *= 1 - 0.1 * Math.exp(-Math.pow(u * 5, 2)) * (1 - t); // a faint centre vein
    shade *= 1 + 0.08 * Math.pow(Math.abs(u), 3); // lighter edges
    shade = Math.min(1, shade);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
  }
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function flowerMaterial() {
  return new MeshPhysicalMaterial({
    vertexColors: true, side: DoubleSide, roughness: 0.42, metalness: 0,
    sheen: 1, sheenRoughness: 0.5, sheenColor: new Color(0xffffff),
  });
}

/** Colour a flower so it glows a little from within, which is what makes the colour pop. */
export function tintFlower(mat, color) {
  mat.color.copy(color);
  mat.emissive.copy(color).multiplyScalar(0.18);
  mat.sheenColor.copy(color).lerp(new Color(0xffffff), 0.45);
}

function addColor(g, r, gg, b) {
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; }
  g.setAttribute('color', new Float32BufferAttribute(a, 3));
  return g;
}

/** Build the merged closed and open petal geometry, with the open shape stored as a morph target. */
function makeMorph(rings, step, seed) {
  const rand = rng(seed);
  const closedParts = [];
  const openParts = [];
  rings.forEach((ring, l) => {
    // Frilly petals need more cuts across to show the frill; plain ones can be coarser.
    const base = petalGeometry(ring.len, ring.w, ring.curl, ring.cup, 6, (ring.ruffle || 0) > 0.25 ? 6 : 4, ring.ruffle || 0);
    for (let i = 0; i < ring.n; i++) {
      const yaw = (i * TAU) / ring.n + l * step + (rand() - 0.5) * 0.2;
      const shade = 0.84 + rand() * 0.16;
      const lenK = 0.92 + rand() * 0.16;
      const make = (tilt, scale) => {
        const g = base.clone();
        const c = g.attributes.color;
        for (let k = 0; k < c.count; k++) c.setXYZ(k, c.getX(k) * shade, c.getY(k) * shade, c.getZ(k) * shade);
        const m = new Matrix4().makeRotationY(yaw)
          .multiply(new Matrix4().makeTranslation(0, -l * 0.012, ring.r)) // each outer ring sits a touch lower, so petals never share a surface
          .multiply(new Matrix4().makeRotationX(tilt))
          .multiply(new Matrix4().makeScale(scale, scale, scale));
        g.applyMatrix4(m);
        return g;
      };
      closedParts.push(make(ring.tilt[0], 0.35 * lenK));
      openParts.push(make(ring.tilt[1], lenK));
    }
  });
  const closed = mergeGeometries(closedParts);
  const open = mergeGeometries(openParts);
  const pc = closed.attributes.position.array, po = open.attributes.position.array;
  const nc = closed.attributes.normal.array, no = open.attributes.normal.array;
  const dp = new Float32Array(pc.length), dn = new Float32Array(nc.length);
  for (let i = 0; i < pc.length; i++) { dp[i] = po[i] - pc[i]; dn[i] = no[i] - nc[i]; }
  closed.morphAttributes.position = [new Float32BufferAttribute(dp, 3)];
  closed.morphAttributes.normal = [new Float32BufferAttribute(dn, 3)];
  closed.morphTargetsRelative = true;
  [...closedParts, ...openParts].forEach((g) => g.dispose());
  return closed;
}

const morphCache = new Map();
function morphFor(key, rings, step, seed) {
  if (!morphCache.has(key)) morphCache.set(key, makeMorph(rings, step, seed));
  return morphCache.get(key);
}

const ROSE = [
  { n: 5, r: 0.012, len: 0.17, w: 0.15, tilt: [0.04, 0.12], curl: -0.5, cup: 0.7, ruffle: 0.1 },
  { n: 6, r: 0.028, len: 0.21, w: 0.18, tilt: [0.18, 0.42], curl: -0.28, cup: 0.6, ruffle: 0.15 },
  { n: 7, r: 0.048, len: 0.26, w: 0.22, tilt: [0.36, 0.78], curl: 0.02, cup: 0.5, ruffle: 0.2 },
  { n: 8, r: 0.068, len: 0.3, w: 0.25, tilt: [0.55, 1.15], curl: 0.28, cup: 0.45, ruffle: 0.3 },
  { n: 9, r: 0.088, len: 0.33, w: 0.27, tilt: [0.75, 1.5], curl: 0.45, cup: 0.4, ruffle: 0.35 },
];
const PEONY = [
  { n: 5, r: 0.01, len: 0.12, w: 0.12, tilt: [0.05, 0.1], curl: -0.55, cup: 0.8, ruffle: 0.2 },
  { n: 7, r: 0.022, len: 0.16, w: 0.16, tilt: [0.12, 0.3], curl: -0.35, cup: 0.7, ruffle: 0.3 },
  { n: 8, r: 0.035, len: 0.2, w: 0.2, tilt: [0.25, 0.55], curl: -0.1, cup: 0.6, ruffle: 0.4 },
  { n: 9, r: 0.05, len: 0.24, w: 0.24, tilt: [0.4, 0.85], curl: 0.1, cup: 0.55, ruffle: 0.5 },
  { n: 10, r: 0.065, len: 0.28, w: 0.27, tilt: [0.55, 1.1], curl: 0.25, cup: 0.5, ruffle: 0.6 },
  { n: 11, r: 0.08, len: 0.31, w: 0.29, tilt: [0.7, 1.35], curl: 0.38, cup: 0.45, ruffle: 0.7 },
  { n: 12, r: 0.095, len: 0.34, w: 0.3, tilt: [0.85, 1.55], curl: 0.5, cup: 0.4, ruffle: 0.8 },
];
const TULIP = [
  { n: 3, r: 0.03, len: 0.42, w: 0.27, tilt: [0.06, 0.36], curl: -0.3, cup: 0.95, ruffle: 0 },
  { n: 3, r: 0.02, len: 0.39, w: 0.25, tilt: [0.03, 0.24], curl: -0.34, cup: 0.95, ruffle: 0 },
  { n: 3, r: 0.008, len: 0.3, w: 0.2, tilt: [0.01, 0.12], curl: -0.4, cup: 0.9, ruffle: 0 },
];
const DAISY = [
  { n: 20, r: 0.07, len: 0.34, w: 0.09, tilt: [0.4, 1.32], curl: 0.12, cup: 0.25, ruffle: 0 },
  { n: 20, r: 0.06, len: 0.3, w: 0.085, tilt: [0.35, 1.22], curl: 0.1, cup: 0.25, ruffle: 0 },
  { n: 12, r: 0.05, len: 0.2, w: 0.08, tilt: [0.3, 1.1], curl: 0.08, cup: 0.25, ruffle: 0 },
];
const SUNFLOWER = [
  { n: 26, r: 0.14, len: 0.4, w: 0.105, tilt: [0.4, 1.38], curl: 0.1, cup: 0.2, ruffle: 0 },
  { n: 26, r: 0.12, len: 0.36, w: 0.1, tilt: [0.35, 1.28], curl: 0.08, cup: 0.2, ruffle: 0 },
  { n: 13, r: 0.1, len: 0.26, w: 0.09, tilt: [0.3, 1.15], curl: 0.06, cup: 0.2, ruffle: 0 },
];

function petalHead(key, rings, step, seed, mat) {
  const group = new Group();
  const mesh = new Mesh(morphFor(key, rings, step, seed), mat);
  group.add(mesh);
  return { group, mesh, extras: [], setOpen(o) { mesh.morphTargetInfluences[0] = o; this.extras.forEach((e) => e(o)); } };
}

// Shared centre pieces for the daisy and the sunflower.
const domeMat = new MeshStandardMaterial({ color: '#4a2f12', roughness: 0.85 });
const daisyDotMat = new MeshStandardMaterial({ color: '#f2c14e', roughness: 0.35, metalness: 0.5 });
const seedMat = new MeshStandardMaterial({ color: '#8a5a22', roughness: 0.6 });
let centreGeo = null;
function centres() {
  if (centreGeo) return centreGeo;
  const dome = (r, sy) => { const g = new SphereGeometry(r, 16, 10); g.scale(1, sy, 1); return g; };
  const dots = (n, radius, step, y0) => {
    const parts = [];
    for (let j = 1; j <= n; j++) {
      const r = step * Math.sqrt(j), a = j * GOLDEN;
      const s = new SphereGeometry(radius, 5, 4);
      s.translate(r * Math.cos(a), y0 - r * 0.18, r * Math.sin(a));
      parts.push(addColor(s, 1, 1, 1));
    }
    const m = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return m;
  };
  centreGeo = {
    daisyDome: dome(0.085, 0.45), daisyDots: dots(48, 0.0135, 0.0105, 0.036),
    sunDome: dome(0.17, 0.4), sunSeeds: dots(110, 0.0105, 0.0147, 0.062),
  };
  return centreGeo;
}

export function buildRose(mat) { return petalHead('rose', ROSE, 0.55, 11, mat); }
export function buildPeony(mat) { return petalHead('peony', PEONY, 0.5, 23, mat); }
export function buildTulip(mat) { return petalHead('tulip', TULIP, 0.9, 37, mat); }

function withCentre(head, domeGeo, dotGeo, dotMat) {
  const c = new Group();
  c.add(new Mesh(domeGeo, domeMat), new Mesh(dotGeo, dotMat));
  head.group.add(c);
  head.extras.push((o) => c.scale.setScalar(lerp(0.5, 1, o)));
  return head;
}
export function buildDaisy(mat) {
  const c = centres();
  return withCentre(petalHead('daisy', DAISY, TAU / 40, 41, mat), c.daisyDome, c.daisyDots, daisyDotMat);
}
export function buildSunflower(mat) {
  const c = centres();
  return withCentre(petalHead('sunflower', SUNFLOWER, TAU / 52, 53, mat), c.sunDome, c.sunSeeds, seedMat);
}

/** A single leaf, base at the origin and tip along +y. */
export function leafGeometry(len, w) {
  return petalGeometry(len, w, 0.18, 0.3, 8, 3, 0);
}
