import {
  Float32BufferAttribute, PlaneGeometry, Group, Mesh, MeshStandardMaterial, DoubleSide,
  SphereGeometry, InstancedMesh, Object3D,
} from 'three';

// Hand-built flower heads. Every head faces +Y with its centre at the origin, and exposes
// setOpen(0..1) so it can bud and then open. Petals are bent planes, shaded base to tip by vertex colour.

const TAU = Math.PI * 2;
const GOLDEN = 2.39996323;
const lerp = (a, b, t) => a + (b - a) * t;

/** A bent petal. Base at the origin, tip along +y, the bowl faces +z. Negative curl closes it inward. */
export function petalGeometry(length, width, curl, cup = 0.5, segY = 9, segX = 4) {
  const g = new PlaneGeometry(1, 1, segX, segY);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + 0.5) * 2 - 1; // -1..1 across
    const t = pos.getY(i) + 0.5; // 0..1 base to tip
    const tt = Math.pow(t, 0.8);
    const half = Math.pow(Math.max(0, 1 - Math.pow(2 * tt - 1, 2)), 0.5); // narrow base, round tip
    const x = u * half * width * 0.5;
    const y = t * length;
    const z = curl * length * t * t + cup * width * 0.5 * u * u * half;
    pos.setXYZ(i, x, y, z);
    const shade = 0.55 + 0.45 * t;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
  }
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function flowerMaterial() {
  return new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.5, metalness: 0.02 });
}

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

/** Rings of petals. Each ring is { n, r, len, w, tilt: [closed, open], curl, cup }. */
function ringHead(mat, rings, offsetStep = 0.5) {
  const group = new Group();
  const petals = [];
  rings.forEach((ring, l) => {
    const geo = cached(`p${ring.len}-${ring.w}-${ring.curl}-${ring.cup}`, () => petalGeometry(ring.len, ring.w, ring.curl, ring.cup));
    for (let i = 0; i < ring.n; i++) {
      const pivot = new Group();
      pivot.rotation.y = (i * TAU) / ring.n + l * offsetStep;
      const mesh = new Mesh(geo, mat);
      mesh.position.z = ring.r;
      mesh.rotation.x = ring.tilt[0];
      pivot.add(mesh);
      group.add(pivot);
      petals.push({ mesh, t0: ring.tilt[0], t1: ring.tilt[1] });
    }
  });
  const setOpen = (o) => {
    petals.forEach((p) => { p.mesh.rotation.x = lerp(p.t0, p.t1, o); p.mesh.scale.setScalar(lerp(0.35, 1, Math.min(1, o * 1.6))); });
  };
  setOpen(0);
  return { group, setOpen };
}

export function buildRose(mat) {
  return ringHead(mat, [
    { n: 5, r: 0.012, len: 0.17, w: 0.15, tilt: [0.04, 0.12], curl: -0.5, cup: 0.7 },
    { n: 6, r: 0.028, len: 0.21, w: 0.18, tilt: [0.18, 0.42], curl: -0.28, cup: 0.6 },
    { n: 7, r: 0.048, len: 0.26, w: 0.22, tilt: [0.36, 0.78], curl: 0.02, cup: 0.5 },
    { n: 8, r: 0.068, len: 0.3, w: 0.25, tilt: [0.55, 1.15], curl: 0.28, cup: 0.45 },
    { n: 9, r: 0.088, len: 0.33, w: 0.27, tilt: [0.75, 1.5], curl: 0.45, cup: 0.4 },
  ], 0.55);
}

export function buildTulip(mat) {
  return ringHead(mat, [
    { n: 3, r: 0.03, len: 0.4, w: 0.26, tilt: [0.08, 0.34], curl: -0.28, cup: 0.9 },
    { n: 3, r: 0.02, len: 0.37, w: 0.24, tilt: [0.03, 0.22], curl: -0.34, cup: 0.9 },
  ], 0.9);
}

/** Daisy with a centre of small gold dots laid out on the same golden angle as the original code flower. */
export function buildDaisy(mat, centreColor = '#e7c26a') {
  const head = ringHead(mat, [
    { n: 18, r: 0.07, len: 0.34, w: 0.085, tilt: [0.4, 1.32], curl: 0.12, cup: 0.25 },
    { n: 18, r: 0.06, len: 0.3, w: 0.08, tilt: [0.35, 1.22], curl: 0.1, cup: 0.25 },
  ], TAU / 36);
  const dome = new Mesh(
    new SphereGeometry(0.085, 18, 10),
    new MeshStandardMaterial({ color: '#7a5a14', roughness: 0.8 }),
  );
  dome.scale.y = 0.45;
  head.group.add(dome);
  const dotMat = new MeshStandardMaterial({ color: centreColor, roughness: 0.35, metalness: 0.5 });
  const n = 64;
  const dots = new InstancedMesh(new SphereGeometry(0.0125, 8, 6), dotMat, n);
  const o = new Object3D();
  for (let j = 1; j <= n; j++) {
    const r = 0.0092 * Math.sqrt(j);
    const a = j * GOLDEN;
    o.position.set(r * Math.cos(a), 0.036 - r * 0.18, r * Math.sin(a));
    o.updateMatrix();
    dots.setMatrixAt(j - 1, o.matrix);
  }
  head.group.add(dots);
  head.centreMat = dotMat;
  return head;
}

/** A single leaf, base at the origin and tip along +y. */
export function leafGeometry(len, w) {
  return cached(`leaf${len}-${w}`, () => petalGeometry(len, w, 0.18, 0.3, 10, 3));
}
