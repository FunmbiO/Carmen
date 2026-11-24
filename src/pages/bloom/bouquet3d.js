import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Color, PMREMGenerator, ACESFilmicToneMapping, DirectionalLight,
  HemisphereLight, Raycaster, Vector2, Vector3, Mesh, SphereGeometry, MeshBasicMaterial, CatmullRomCurve3, TubeGeometry,
  MeshStandardMaterial, DoubleSide, PlaneGeometry, CanvasTexture,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { palette, onTheme } from '../../lib/theme.js';
import { REDUCE, clamp } from '../../lib/util.js';
import { buildRose, buildTulip, buildDaisy, flowerMaterial, leafGeometry } from './flowers3d.js';
import { buildWrap } from './wrap3d.js';
import { createEffects } from './effects3d.js';

// A bouquet built by hand in Three.js. Drag to turn it, tap a flower, add more, let the petals go.

const UP = new Vector3(0, 1, 0);
const GOLDEN = 2.39996323;
const GATHER = new Vector3(0, -0.7, 0); // where every stem meets, inside the paper
export const MAX_FLOWERS = 16;

// type, hue, saturation, lightness, size. The first is the centrepiece.
const PLAN = [
  ['rose', 42, 0.85, 0.58, 1.8], ['daisy', 22, 0.85, 0.6, 1.4], ['rose', 55, 0.82, 0.6, 1.4], ['tulip', 30, 0.9, 0.55, 1.35],
  ['rose', 15, 0.82, 0.55, 1.45], ['daisy', 48, 0.35, 0.88, 1.3], ['tulip', 55, 0.85, 0.6, 1.3], ['rose', 22, 0.75, 0.62, 1.35],
  ['daisy', 60, 0.85, 0.62, 1.25],
];
const EXTRA = ['rose', 'daisy', 'tulip'];

const easeOutBack = (t) => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const rnd = (a, b) => a + Math.random() * (b - a);

function hsl(h, s, l) {
  return new Color().setHSL((((h % 360) + 360) % 360) / 360, clamp(s), clamp(l));
}

function slotFor(i) {
  if (i === 0) return new Vector3(0, 0.98, 0);
  const r = 0.27 * Math.sqrt(i), a = i * GOLDEN;
  return new Vector3(r * Math.cos(a), 0.86 - 0.42 * Math.pow(r / 0.95, 2) + rnd(-0.03, 0.03), r * Math.sin(a));
}

export function createBouquet3D(canvas, { onCount } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0.4, 0.7, 6.4);

  const hemi = new HemisphereLight(0xfff3dd, 0x3a2a1a, 0.5);
  const key = new DirectionalLight(0xfff0d6, 1.8);
  key.position.set(3, 4.5, 3.5);
  const rim = new DirectionalLight(0xffd9a0, 1.2);
  rim.position.set(-3.5, 2.5, -3);
  scene.add(hemi, key, rim);

  const root = new Group();
  scene.add(root);

  // Soft shadow under the bouquet.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sg = shadowCanvas.getContext('2d');
  const sgrad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
  sgrad.addColorStop(0, 'rgba(0,0,0,0.5)'); sgrad.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = sgrad; sg.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(new PlaneGeometry(2.2, 2.2), new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.34;
  root.add(shadow);

  const wrap = buildWrap();
  root.add(wrap.group);

  // Foliage collar behind the flowers, and small sprigs between them.
  const leafMat = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.6 });
  const foliage = new Group();
  foliage.position.copy(GATHER);
  const leaves = [];
  for (let i = 0; i < 13; i++) {
    const len = rnd(0.95, 1.3);
    const leaf = new Mesh(leafGeometry(+len.toFixed(2), 0.34), leafMat);
    const pivot = new Group();
    pivot.rotation.y = (i * Math.PI * 2) / 13 + rnd(-0.12, 0.12);
    leaf.position.set(0, 0.55, 0.05);
    leaf.rotation.x = rnd(0.95, 1.3);
    pivot.add(leaf);
    foliage.add(pivot);
    leaves.push(pivot);
  }
  root.add(foliage);

  const sprigMat = new MeshStandardMaterial({ color: '#f4ead2', roughness: 0.6 });
  const stemMat = new MeshStandardMaterial({ roughness: 0.7 });
  const sprigs = new Group();
  sprigs.position.copy(GATHER);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd(-0.2, 0.2), r = rnd(0.7, 1.05), y = rnd(1.15, 1.45);
    const tip = new Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(tip.x * 0.3, tip.y * 0.5, tip.z * 0.3), tip]);
    sprigs.add(new Mesh(new TubeGeometry(curve, 16, 0.009, 5, false), stemMat));
    for (let k = 0; k < 6; k++) {
      const b = new Mesh(new SphereGeometry(0.03, 8, 6), sprigMat);
      b.position.copy(tip).add(new Vector3(rnd(-0.07, 0.07), rnd(-0.06, 0.08), rnd(-0.07, 0.07)));
      sprigs.add(b);
    }
  }
  root.add(sprigs);

  // Flowers.
  const branches = [];
  const hitMat = new MeshBasicMaterial({ visible: false });

  function addBranch(spec, delay = 0, instant = false) {
    const [type, hue, sat, light, size] = spec;
    const slot = slotFor(branches.length);
    const H = slot.clone().sub(GATHER);
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(H.x * 0.3, H.y * 0.55, H.z * 0.3), H]);
    const branch = new Group();
    branch.position.copy(GATHER);
    branch.add(new Mesh(new TubeGeometry(curve, 26, 0.016, 6, false), stemMat));

    const mat = flowerMaterial();
    const head = type === 'rose' ? buildRose(mat) : type === 'tulip' ? buildTulip(mat) : buildDaisy(mat);
    head.group.position.copy(H);
    head.group.quaternion.setFromUnitVectors(UP, curve.getTangent(1).normalize());
    head.group.scale.setScalar(size);
    const hit = new Mesh(new SphereGeometry(0.34, 10, 8), hitMat);
    hit.userData.index = branches.length;
    head.group.add(hit);
    branch.add(head.group);

    if (type === 'tulip') {
      const p = curve.getPoint(0.45);
      const leaf = new Mesh(leafGeometry(0.7, 0.2), leafMat);
      leaf.rotation.order = 'YXZ';
      leaf.rotation.y = Math.atan2(H.x, H.z);
      leaf.rotation.x = 0.55;
      leaf.position.copy(p);
      branch.add(leaf);
    }

    root.add(branch);
    const b = { branch, head, hit, mat, hue, sat, light, size, delay, age: instant ? 99 : 0, pulse: 0, phase: rnd(0, 6.28) };
    branches.push(b);
    applyBranchColor(b);
    if (onCount) onCount(branches.length);
    return b;
  }

  function applyBranchColor(b) {
    const P = palette();
    b.mat.color = hsl(P.hue(b.hue), b.sat * P.sat, P.light ? b.light - 0.1 : b.light);
  }

  function applyTheme() {
    const P = palette();
    branches.forEach(applyBranchColor);
    leafMat.color = hsl(P.leaf[0], P.leaf[1] / 100 + 0.1, P.leaf[2] / 100 + 0.12);
    stemMat.color = hsl(P.leaf[0], P.leaf[1] / 100, P.leaf[2] / 100);
    wrap.setRibbonColor(P.ribbon[2]);
    rim.color = new Color(`rgb(${P.glow})`);
    renderer.toneMappingExposure = P.light ? 0.88 : 0.95;
  }

  PLAN.forEach((s, i) => addBranch(s, i * 0.18));
  applyTheme();
  onTheme(applyTheme);

  // Camera and controls.
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.05, 0);
  controls.enablePan = false;
  controls.enableZoom = false; // keeps the page scrollable over the canvas
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minPolarAngle = 0.85;
  controls.maxPolarAngle = 1.7;
  controls.autoRotate = !REDUCE;
  controls.autoRotateSpeed = 0.9;
  canvas.style.touchAction = 'none'; // a drag on the bouquet turns it and never scrolls the page
  let resumeTimer = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); if (onInteract) onInteract(); });
  controls.addEventListener('end', () => { clearTimeout(resumeTimer); if (!REDUCE) resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 3500); });
  let onInteract = null;

  // Taps.
  const ray = new Raycaster();
  const ndc = new Vector2();
  let down = null;
  const hitTargets = () => branches.map((b) => b.hit);
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(hitTargets(), false);
    return hits.length ? branches[hits[0].object.userData.index] : null;
  }
  const effects = createEffects(scene);
  function tap(b) {
    b.pulse = 1;
    const p = new Vector3();
    b.head.group.getWorldPosition(p);
    const P = palette();
    effects.burst(p, `rgb(${P.core})`, P.light);
  }
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved < 7 && dt < 450) { const b = pick(e); if (b) { tap(b); if (onInteract) onInteract(); } }
  });
  let hoverT = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (e.buttons || now - hoverT < 80) return;
    hoverT = now;
    canvas.style.cursor = pick(e) ? 'pointer' : 'grab';
  });
  // Keyboard: arrows turn the bouquet.
  canvas.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const off = camera.position.clone().sub(controls.target);
    const a = (e.key === 'ArrowLeft' ? 1 : -1) * 0.3;
    off.applyAxisAngle(UP, a);
    camera.position.copy(controls.target).add(off);
    controls.update();
  });

  function resize() {
    const w = canvas.parentElement.clientWidth || 360;
    const h = clamp(Math.round(w * 1.15), 440, 620);
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    canvas.style.height = h + 'px';
    camera.aspect = w / h;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const needW = 3.0 / (2 * half * Math.min(1, camera.aspect)); // bouquet width in view
    const needH = 3.7 / (2 * half);
    const dist = Math.max(needW, needH);
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    camera.updateProjectionMatrix();
  }

  let time = 0;
  function draw(now, dt) {
    time += dt;
    branches.forEach((b) => {
      b.age += dt;
      const g = clamp((b.age - b.delay) / 1.5);
      const s = g <= 0 ? 0.0001 : easeOutBack(g);
      b.branch.scale.setScalar(Math.max(0.0001, s));
      b.head.setOpen(easeOutCubic(clamp((b.age - b.delay - 0.8) / 1.4)));
      b.pulse = Math.max(0, b.pulse - dt * 1.5);
      b.head.group.scale.setScalar(b.size * (1 + 0.24 * Math.sin(Math.PI * b.pulse)));
      b.branch.rotation.z = REDUCE ? 0 : Math.sin(time * 0.7 + b.phase) * 0.012;
      b.branch.rotation.x = REDUCE ? 0 : Math.cos(time * 0.6 + b.phase) * 0.01;
    });
    const fg = clamp((branches[0].age - 0.1) / 1.1);
    foliage.scale.setScalar(Math.max(0.0001, easeOutBack(fg)));
    sprigs.scale.setScalar(Math.max(0.0001, easeOutBack(clamp((branches[0].age - 0.9) / 1.2))));
    leaves.forEach((l, i) => { l.rotation.z = REDUCE ? 0 : Math.sin(time * 0.5 + i) * 0.015; });
    effects.update(dt);
    controls.update(dt);
    renderer.render(scene, camera);
  }

  // Features.
  function replay() { branches.forEach((b, i) => { b.age = 0; b.delay = i * 0.16; }); foliage.scale.setScalar(0.0001); }
  function addFlower() {
    if (branches.length >= MAX_FLOWERS) return false;
    const i = branches.length;
    const type = EXTRA[i % 3];
    const hues = [42, 30, 52, 22, 60, 36, 15, 48];
    const b = addBranch([type, hues[i % hues.length], rnd(0.75, 0.88), rnd(0.55, 0.64), rnd(1.2, 1.45)], 0);
    b.age = 0;
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { if (!REDUCE) controls.autoRotate = true; }, 3500);
    return true;
  }
  function scatter() {
    const origins = branches.map((b) => { const p = new Vector3(); b.head.group.getWorldPosition(p); return p; });
    effects.scatter(origins, branches[Math.floor(Math.random() * branches.length)].mat, 44);
    branches.forEach((b) => { b.pulse = 0.8; });
  }

  async function snapshot() {
    try { await document.fonts.load('48px "Pinyon Script"'); } catch { /* font API missing */ }
    renderer.render(scene, camera);
    const w = canvas.width, h = canvas.height;
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const c = out.getContext('2d');
    const cs = getComputedStyle(document.documentElement);
    const P = palette();
    c.fillStyle = cs.getPropertyValue('--bg').trim() || '#f6efe3';
    c.fillRect(0, 0, w, h);
    const glow = c.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.7);
    glow.addColorStop(0, `rgba(${P.glow},0.28)`); glow.addColorStop(1, `rgba(${P.glow},0)`);
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.drawImage(canvas, 0, 0);
    c.fillStyle = cs.getPropertyValue('--accent').trim() || '#5a1624';
    c.textAlign = 'center';
    c.font = `${Math.round(h * 0.085)}px "Pinyon Script", cursive`;
    c.fillText('For Carmen', w / 2, h * 0.11);
    const blob = await new Promise((res) => out.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], 'carmen-bouquet.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'For Carmen' }); return 'shared'; } catch { /* cancelled, fall through to a download */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'carmen-bouquet.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'saved';
  }

  resize();
  return {
    draw, resize, replay, addFlower, scatter, snapshot,
    count: () => branches.length,
    onInteract(fn) { onInteract = fn; },
  };
}
