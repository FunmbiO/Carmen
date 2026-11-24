import {
  Group, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, CatmullRomCurve3, Vector3, Quaternion, Matrix4,
  Float32BufferAttribute, DoubleSide, Color,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { petalGeometry } from './flowers3d.js';

// Fillers and greenery. Each kind is merged into one mesh, so a lot of detail costs very few draw calls.

const TAU = Math.PI * 2;
const GOLDEN = 2.39996323;
const UP = new Vector3(0, 1, 0);
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);

function addColor(g, r, gg, b) {
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; }
  g.setAttribute('color', new Float32BufferAttribute(a, 3));
  return g;
}
function shadeColor(g, fn) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const v = fn(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2]; }
  g.setAttribute('color', new Float32BufferAttribute(c, 3));
  return g;
}

export const budMaterial = () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });

/** A spike of small buds up a stem. The head grows upward from the origin. */
let lavGeo = null;
export function buildLavender(mat) {
  if (!lavGeo) {
    const parts = [];
    const n = 30;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = i * GOLDEN, r = lerp(0.032, 0.008, t);
      const g = new SphereGeometry(lerp(0.026, 0.016, t), 6, 4);
      g.scale(0.8, 1.55, 0.8);
      g.translate(Math.cos(a) * r, t * 0.55, Math.sin(a) * r);
      parts.push(shadeColor(g, (x, y) => { const k = 0.7 + 0.3 * Math.min(1, y / 0.5); return [k, k, k]; }));
    }
    lavGeo = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
  }
  const group = new Group();
  group.add(new Mesh(lavGeo, mat));
  return { group, setOpen(o) { group.scale.set(1, lerp(0.2, 1, o), 1); } };
}

/** A round cluster of tiny florets. */
let hydGeo = null;
export function buildHydrangea(mat) {
  if (!hydGeo) {
    const parts = [];
    const n = 86, R = 0.27;
    const q = new Quaternion();
    for (let i = 0; i < n; i++) {
      // Points spread over a dome with the golden angle.
      const y = 1 - (i + 0.5) / n * 0.95, rr = Math.sqrt(1 - y * y), a = i * GOLDEN;
      const nrm = new Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
      const g = new SphereGeometry(0.056, 6, 4);
      g.scale(1, 0.48, 1);
      q.setFromUnitVectors(UP, nrm);
      g.applyMatrix4(new Matrix4().compose(nrm.clone().multiplyScalar(R), q, new Vector3(1, 1, 1)));
      const k = 0.78 + Math.random() * 0.22;
      parts.push(addColor(g, k, k, k));
    }
    hydGeo = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
  }
  const group = new Group();
  group.add(new Mesh(hydGeo, mat));
  return { group, setOpen(o) { group.scale.setScalar(lerp(0.3, 1, o)); } };
}

/** Greenery: a collar of big leaves, silver eucalyptus sprigs and baby's breath. G is where the stems meet. */
export function buildGreens(G) {
  const group = new Group();
  group.position.copy(G);

  // Collar of long leaves fanning out under the flowers.
  const collar = [];
  for (let i = 0; i < 18; i++) {
    const len = rnd(0.95, 1.35), w = rnd(0.3, 0.42);
    const g = petalGeometry(len, w, 0.22, 0.3, 8, 3, 0.1);
    const az = (i / 18) * TAU + rnd(-0.12, 0.12);
    const tilt = rnd(0.9, 1.4);
    const m = new Matrix4().makeRotationY(az)
      .multiply(new Matrix4().makeTranslation(0, 0.52, 0.05))
      .multiply(new Matrix4().makeRotationX(tilt));
    g.applyMatrix4(m);
    collar.push(g);
  }
  const collarGeo = mergeGeometries(collar);
  collar.forEach((g) => g.dispose());
  const collarMat = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.55 });
  group.add(new Mesh(collarGeo, collarMat));

  // Silver eucalyptus: sprigs of round leaves.
  const euc = [];
  for (let s = 0; s < 9; s++) {
    const a = (s / 9) * TAU + rnd(-0.2, 0.2), r = rnd(0.95, 1.3), y = rnd(0.55, 1.15);
    const tip = new Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const curve = new CatmullRomCurve3([new Vector3(0, 0.3, 0), new Vector3(tip.x * 0.4, tip.y * 0.55, tip.z * 0.4), tip]);
    euc.push(addColor(new TubeGeometry(curve, 14, 0.008, 5, false), 0.35, 0.42, 0.3));
    for (let k = 0; k < 11; k++) {
      const t = 0.18 + (k / 11) * 0.8;
      const p = curve.getPoint(t), tan = curve.getTangent(t);
      const g = petalGeometry(0.17, 0.15, 0.2, 0.4, 4, 3, 0);
      const side = k % 2 ? 1 : -1;
      const q = new Quaternion().setFromUnitVectors(UP, tan.clone().add(new Vector3(side * 0.9, 0.15, side * 0.4)).normalize());
      g.applyMatrix4(new Matrix4().compose(p, q, new Vector3(1, 1, 1)));
      euc.push(g);
    }
  }
  const eucGeo = mergeGeometries(euc);
  euc.forEach((g) => g.dispose());
  const eucMat = new MeshStandardMaterial({ vertexColors: true, color: '#9fb8a8', side: DoubleSide, roughness: 0.6 });
  group.add(new Mesh(eucGeo, eucMat));

  // Baby's breath: thin sprigs tipped with tiny white blossoms.
  const gyp = [];
  for (let s = 0; s < 16; s++) {
    const a = rnd(0, TAU), r = rnd(0.5, 1.25), y = rnd(0.9, 1.55);
    const tip = new Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const curve = new CatmullRomCurve3([new Vector3(0, 0.3, 0), new Vector3(tip.x * 0.3, tip.y * 0.5, tip.z * 0.3), tip]);
    gyp.push(addColor(new TubeGeometry(curve, 12, 0.006, 4, false), 0.45, 0.58, 0.4));
    for (let k = 0; k < 8; k++) {
      const b = new SphereGeometry(rnd(0.022, 0.034), 5, 4);
      b.translate(tip.x + rnd(-0.1, 0.1), tip.y + rnd(-0.09, 0.1), tip.z + rnd(-0.1, 0.1));
      gyp.push(addColor(b, 1, 0.98, 0.93));
    }
  }
  const gypGeo = mergeGeometries(gyp);
  gyp.forEach((g) => g.dispose());
  const gypMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  group.add(new Mesh(gypGeo, gypMat));

  return {
    group,
    setLeafColor(c) { collarMat.color = c; },
  };
}

export const WHITE = new Color(0xffffff);
