import {
  Group, Mesh, CylinderGeometry, MeshStandardMaterial, BackSide, FrontSide, Float32BufferAttribute,
  TorusGeometry, SphereGeometry, Color,
} from 'three';
import { petalGeometry } from './flowers3d.js';

// Kraft paper cone with a cream lining, and a satin ribbon tied in a bow.

export const PAPER_TOP = 0.05;
export const PAPER_BOTTOM = -1.3;
const R_TOP = 0.88;
const R_BOTTOM = 0.12;

export function coneRadiusAt(y) {
  const f = (y - PAPER_BOTTOM) / (PAPER_TOP - PAPER_BOTTOM);
  return R_BOTTOM + (R_TOP - R_BOTTOM) * f;
}

function paperGeometry() {
  const h = PAPER_TOP - PAPER_BOTTOM;
  const g = new CylinderGeometry(R_TOP, R_BOTTOM, h, 48, 14, true);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const t = (pos.getY(i) + h / 2) / h; // 0 bottom, 1 top
    const a = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    // Crumpled folds, stronger toward the open rim.
    const fold = 1 + 0.03 * Math.sin(a * 7 + 0.4) * (0.3 + t) + 0.07 * t * t * Math.sin(a * 5 + 0.7);
    pos.setXYZ(
      i,
      Math.cos(a) * r * fold,
      pos.getY(i) + (PAPER_BOTTOM + h / 2) + 0.07 * t * t * Math.sin(a * 3 + 1.2),
      Math.sin(a) * r * fold,
    );
    const shade = 0.86 + 0.14 * Math.sin(a * 7 + 0.4) * (0.4 + t * 0.6);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
  }
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function buildWrap() {
  const group = new Group();
  const geo = paperGeometry();
  const outer = new Mesh(geo, new MeshStandardMaterial({ color: '#b98b5e', vertexColors: true, roughness: 0.92, side: FrontSide }));
  const lining = new Mesh(geo, new MeshStandardMaterial({ color: '#f1e5cc', roughness: 0.9, side: BackSide }));
  group.add(outer, lining);

  // Ribbon around the paper, with the bow at the front.
  const ribbonMat = new MeshStandardMaterial({ color: '#ffd86b', roughness: 0.28, metalness: 0.65 });
  const ry = -0.66;
  const ring = new Mesh(new TorusGeometry(coneRadiusAt(ry) + 0.018, 0.03, 10, 64), ribbonMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = ry;
  group.add(ring);

  const bow = new Group();
  bow.position.set(0, ry, coneRadiusAt(ry) + 0.05);
  [-1, 1].forEach((d) => {
    const loop = new Mesh(new TorusGeometry(0.13, 0.028, 10, 36), ribbonMat);
    loop.scale.set(0.85, 1.35, 0.7);
    loop.position.set(d * 0.15, 0.03, 0);
    loop.rotation.z = d * 0.5;
    loop.rotation.y = d * -0.25;
    bow.add(loop);
    const tail = new Mesh(petalGeometry(0.5, 0.09, 0.2, 0.1, 10, 2), ribbonMat);
    tail.rotation.set(Math.PI - 0.12, 0, d * 0.28);
    tail.position.set(d * 0.05, -0.02, 0.02);
    bow.add(tail);
  });
  const knot = new Mesh(new SphereGeometry(0.06, 16, 12), ribbonMat);
  knot.scale.set(1.1, 0.9, 0.8);
  bow.add(knot);
  group.add(bow);

  return {
    group,
    setRibbonColor(c) { ribbonMat.color = new Color(c); },
  };
}
