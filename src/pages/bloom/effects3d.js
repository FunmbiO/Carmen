import {
  Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, CanvasTexture, AdditiveBlending, NormalBlending,
  Mesh, Vector3, Color,
} from 'three';
import { petalGeometry } from './flowers3d.js';

// Short-lived effects: a burst of gold dust when a flower is tapped, and petals falling from the bouquet.

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function createEffects(scene) {
  const tex = glowTexture();
  const bursts = [];
  const falling = [];
  const petalGeo = petalGeometry(0.16, 0.11, 0.25, 0.4, 5, 2);

  function burst(pos, color, light) {
    const n = 30;
    const arr = new Float32Array(n * 3);
    const vel = [];
    for (let i = 0; i < n; i++) {
      arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = 0.5 + Math.random() * 1.3;
      const r = Math.sqrt(1 - u * u);
      vel.push(new Vector3(Math.cos(a) * r * s, u * s + 0.5, Math.sin(a) * r * s));
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(arr, 3));
    const mat = new PointsMaterial({
      size: 0.11, map: tex, color: new Color(color), transparent: true, depthWrite: false,
      blending: light ? NormalBlending : AdditiveBlending, sizeAttenuation: true,
    });
    const pts = new Points(geo, mat);
    scene.add(pts);
    bursts.push({ pts, vel, life: 0, max: 1.4 });
  }

  /** Let petals go from the given world positions. */
  function scatter(origins, material, count = 40) {
    for (let i = 0; i < count; i++) {
      const o = origins[i % origins.length];
      const m = new Mesh(petalGeo, material);
      m.position.copy(o).add(new Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.3) * 0.2, (Math.random() - 0.5) * 0.3));
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      scene.add(m);
      falling.push({
        m, life: 0, max: 3 + Math.random() * 1.6,
        v: new Vector3((Math.random() - 0.5) * 0.7, 0.5 + Math.random() * 0.7, (Math.random() - 0.5) * 0.7),
        spin: new Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3),
        ph: Math.random() * 6,
      });
    }
  }

  function update(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life += dt;
      const p = b.pts.geometry.attributes.position;
      b.vel.forEach((v, k) => {
        v.y -= 1.2 * dt;
        p.setXYZ(k, p.getX(k) + v.x * dt, p.getY(k) + v.y * dt, p.getZ(k) + v.z * dt);
      });
      p.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.life / b.max);
      if (b.life >= b.max) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
    }
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      f.life += dt;
      f.v.y -= 1.5 * dt;
      f.v.multiplyScalar(1 - 0.9 * dt);
      f.m.position.addScaledVector(f.v, dt);
      f.m.position.x += Math.sin(f.life * 3 + f.ph) * 0.35 * dt; // flutter
      f.m.rotation.x += f.spin.x * dt; f.m.rotation.y += f.spin.y * dt; f.m.rotation.z += f.spin.z * dt;
      const k = Math.min(1, (f.max - f.life) / 0.6);
      f.m.scale.setScalar(Math.max(0.0001, k));
      if (f.life >= f.max) { scene.remove(f.m); falling.splice(i, 1); }
    }
  }

  // A slow drift of glowing motes around the bouquet, brighter during the opening.
  const MOTES = 110;
  const mp = new Float32Array(MOTES * 3), mv = [];
  for (let i = 0; i < MOTES; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.5;
    mp[i * 3] = Math.cos(a) * r; mp[i * 3 + 1] = -1 + Math.random() * 3.6; mp[i * 3 + 2] = Math.sin(a) * r;
    mv.push(0.06 + Math.random() * 0.16);
  }
  const mg = new BufferGeometry();
  mg.setAttribute('position', new Float32BufferAttribute(mp, 3));
  const motesMat = new PointsMaterial({ size: 0.075, map: tex, color: new Color('#ffe9b0'), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.8 });
  const motes = new Points(mg, motesMat);
  scene.add(motes);
  function driftMotes(dt, strength, color, light) {
    const p = mg.attributes.position;
    for (let i = 0; i < MOTES; i++) {
      let y = p.getY(i) + mv[i] * dt;
      if (y > 2.6) y = -1;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    motesMat.opacity = 0.85 * strength;
    motesMat.blending = light ? NormalBlending : AdditiveBlending;
    if (color) motesMat.color.set(color);
  }

  return { burst, scatter, update, driftMotes };
}
