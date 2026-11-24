import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Color, PMREMGenerator, NeutralToneMapping, DirectionalLight,
  HemisphereLight, Raycaster, Vector2, Vector3, Mesh, SphereGeometry, MeshBasicMaterial, CatmullRomCurve3, TubeGeometry,
  MeshStandardMaterial, PlaneGeometry, CanvasTexture,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { palette, onTheme } from '../../lib/theme.js';
import { REDUCE, clamp } from '../../lib/util.js';
import { vivid, hsl } from './colors3d.js';
import { START_FLOWERS, MAX_FLOWERS, REACH, specAt, hydrangeaSlots } from './plan3d.js';
import { planLayout, placeNew, outward, COLLIDE, DOME } from './layout3d.js';
import { buildRose, buildPeony, buildTulip, buildDaisy, buildSunflower, flowerMaterial, tintFlower } from './flowers3d.js';
import { buildLavender, buildHydrangea, buildGreens, budMaterial } from './fillers3d.js';
import { buildWrap } from './wrap3d.js';
import { createEffects } from './effects3d.js';
import { createCinema, CINEMA } from './cinema3d.js';

// A bouquet built by hand in Three.js: roses, peonies, daisies, sunflowers and tulips, with lavender, hydrangea,
// baby's breath and eucalyptus, in coloured paper and a satin bow. Drag to turn it, tap a flower, add more.

const UP = new Vector3(0, 1, 0);
const GOLDEN = 2.39996323;
const GATHER = new Vector3(0, -0.7, 0); // where every stem meets, inside the paper
export { START_FLOWERS, MAX_FLOWERS };

const BUILD = { rose: buildRose, peony: buildPeony, daisy: buildDaisy, tulip: buildTulip, sunflower: buildSunflower };
const PAPER = { noir: '#127a55', terra: '#d8643a', ivory: '#f7ecd9' }; // the wrapping follows the theme, the flowers do not

const easeOutBack = (t) => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const rnd = (a, b) => a + Math.random() * (b - a);

export function createBouquet3D(canvas, { onCount } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping; // keeps saturated colours saturated
  renderer.toneMappingExposure = 1.0;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const ENV = 0.5;
  scene.environmentIntensity = ENV;

  const camera = new PerspectiveCamera(CINEMA.FOV1, 1, 0.1, 50);
  const target = new Vector3(0, CINEMA.TY1, 0);

  // Warm key, warm front fill, cool back rim: the temperature split makes the colours stand apart.
  const LIGHT = { hemi: 0.55, key: 2.0, fill: 0.9, rim: 1.5 };
  const hemi = new HemisphereLight(0xfff3dd, 0x2a2018, LIGHT.hemi);
  const key = new DirectionalLight(0xfff1da, LIGHT.key);
  key.position.set(3, 4.5, 3.5);
  const fill = new DirectionalLight(0xffd2a8, LIGHT.fill);
  fill.position.set(-3, 1.5, 3);
  const rim = new DirectionalLight(0x9db9ff, LIGHT.rim);
  rim.position.set(-3.5, 3, -3.2);
  scene.add(hemi, key, fill, rim);
  function applyLight(k) {
    hemi.intensity = LIGHT.hemi * k; key.intensity = LIGHT.key * k; fill.intensity = LIGHT.fill * k; rim.intensity = LIGHT.rim * k;
    scene.environmentIntensity = ENV * k;
  }

  const root = new Group();
  scene.add(root);

  // Soft shadow under the bouquet.
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const sg = sc.getContext('2d');
  const grad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(new PlaneGeometry(2.4, 2.4), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.34;
  root.add(shadow);

  const wrap = buildWrap();
  root.add(wrap.group);
  const greens = buildGreens(GATHER);
  root.add(greens.group);

  const stemMat = new MeshStandardMaterial({ color: '#2f7a3a', roughness: 0.65 });
  const effects = createEffects(scene);

  // Branches: a stem and a head, growing out from the point where the stems meet.
  const branches = []; // the flowers she counts and taps
  const fillers = []; // lavender and hydrangea
  const hitMat = new MeshBasicMaterial({ visible: false });

  // The layout decides where every head goes, so neighbours have room and petals do not pierce each other.
  const placed = []; // { p: [x, y, z], r } for everything placed so far, so later heads can find free room
  const hydSlots = hydrangeaSlots();
  const layout = planLayout(
    Array.from({ length: START_FLOWERS }, (_, i) => ({ reach: specAt(i).reach }))
      .concat(hydSlots.map((p) => ({ reach: 0.3, fixed: p }))),
  );
  const shrink = layout.scale; // how much the layout had to shrink the flowers to fit
  layout.positions.forEach((p, i) => placed.push({ p, r: layout.radii[i] }));

  /** A stem from the gather point to a head. faceOut: 1 turns the head to face away from the dome, 0 follows the stem. */
  function makeBranch(builder, mat, size, slot, delay, isFlower, faceOut) {
    const H = slot.clone().sub(GATHER);
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(H.x * 0.3, H.y * 0.55, H.z * 0.3), H]);
    const branch = new Group();
    branch.position.copy(GATHER);
    branch.add(new Mesh(new TubeGeometry(curve, 26, 0.016, 6, false), stemMat));
    const head = builder(mat);
    head.group.position.copy(H);
    const out = new Vector3(...outward([slot.x, slot.y, slot.z])).multiplyScalar(faceOut)
      .addScaledVector(curve.getTangent(1).normalize(), 1 - faceOut).normalize();
    head.group.quaternion.setFromUnitVectors(UP, out);
    head.group.scale.setScalar(size);
    let hit = null;
    if (isFlower) {
      hit = new Mesh(new SphereGeometry(0.3, 10, 8), hitMat);
      hit.userData.index = branches.length;
      head.group.add(hit);
    }
    branch.add(head.group);
    root.add(branch);
    return { branch, head, hit, mat, size, delay, age: 0, pulse: 0, phase: rnd(0, 6.28) };
  }

  function addFlower(i, delay = 0) {
    const spec = specAt(i);
    let p;
    if (i < START_FLOWERS) p = layout.positions[i];
    else { // an extra flower goes in the roomiest gap
      const spot = placeNew(placed, spec.reach * shrink, { seed: i });
      p = spot.p;
      placed.push({ p, r: spot.r });
    }
    const mat = flowerMaterial();
    tintFlower(mat, vivid(spec.color));
    const b = makeBranch(BUILD[spec.type], mat, spec.size * shrink, new Vector3(...p), delay, true, 0.75);
    branches.push(b);
    if (onCount) onCount(branches.length);
    return b;
  }

  function addFiller(builder, p, colorHex, size, faceOut) {
    const mat = budMaterial();
    mat.color = new Color(colorHex);
    fillers.push(makeBranch(builder, mat, size, new Vector3(...p), 0, false, faceOut));
  }

  for (let i = 0; i < START_FLOWERS; i++) addFlower(i, 0);
  // Hydrangea sits low around the rim, in the spots the flowers were laid out around.
  const hyd = [hsl(225, 0.62, 0.7), hsl(330, 0.55, 0.78), hsl(215, 0.6, 0.62)];
  hydSlots.forEach((p, i) => addFiller(buildHydrangea, p, hyd[i], 0.95, 0.9));
  // Lavender stands tall, each spike in a gap near the top of the dome.
  const lav = [hsl(268, 0.62, 0.62), hsl(282, 0.7, 0.5), hsl(262, 0.55, 0.7)];
  for (let i = 0; i < 8; i++) {
    const spot = placeNew(placed, 0.12, { thMin: 0.25, thMax: 1.0, hMin: 0.35, hMax: 0.8, seed: 100 + i });
    placed.push({ p: spot.p, r: spot.r });
    addFiller(buildLavender, spot.p, lav[i % 3], rnd(0.95, 1.15), 0.2);
  }

  function applyTheme() {
    const P = palette();
    greens.setLeafColor(hsl(P.leaf[0], 0.55, 0.36));
    wrap.setRibbonColor(P.ribbon[2]);
    wrap.setPaperColor(PAPER[P.id] || '#b98b5e');
    effects.motesColor = `rgb(${P.core})`;
  }
  applyTheme();
  onTheme(applyTheme);

  // Camera and controls.
  const controls = new OrbitControls(camera, canvas);
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
  let onInteract = null;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); if (onInteract) onInteract(); });
  controls.addEventListener('end', () => { clearTimeout(resumeTimer); if (!REDUCE) resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 3500); });

  let dist = 6.5;
  const introHooks = {}; // filled in by the page through onIntro()
  const cinema = createCinema({ camera, controls, target, getDist: () => dist, hooks: introHooks });

  // Taps.
  const ray = new Raycaster();
  const ndc = new Vector2();
  let down = null;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(branches.map((b) => b.hit), false);
    return hits.length ? branches[hits[0].object.userData.index] : null;
  }
  function tap(b) {
    b.pulse = 1;
    const p = new Vector3();
    b.head.group.getWorldPosition(p);
    effects.burst(p, b.mat.color, palette().light);
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (cinema.active) { cinema.skip(); branches.concat(fillers).forEach((b) => { b.age = 99; }); return; } // a tap skips the opening
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved < 7 && dt < 450) { const b = pick(e); if (b) { tap(b); if (onInteract) onInteract(); } }
  });
  let hoverT = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (e.buttons || cinema.active || now - hoverT < 80) return;
    hoverT = now;
    canvas.style.cursor = pick(e) ? 'pointer' : 'grab';
  });
  canvas.addEventListener('keydown', (e) => {
    if (cinema.active || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const off = camera.position.clone().sub(controls.target);
    off.applyAxisAngle(UP, (e.key === 'ArrowLeft' ? 1 : -1) * 0.3);
    camera.position.copy(controls.target).add(off);
    controls.update();
  });

  function resize() {
    const w = canvas.parentElement.clientWidth || 360;
    const h = clamp(Math.round(w * 1.15), 440, 640);
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    canvas.style.height = h + 'px';
    camera.aspect = w / h;
    const half = Math.tan((CINEMA.FOV1 * Math.PI) / 360);
    dist = Math.max(3.9 / (2 * half * Math.min(1, camera.aspect)), 3.9 / (2 * half));
    if (!cinema.active) {
      // Keep her current turn, just refit the distance.
      const dir = camera.position.clone().sub(controls.target);
      if (dir.lengthSq() < 0.01) cinema.restingView();
      else camera.position.copy(controls.target).addScaledVector(dir.normalize(), dist);
    }
    camera.updateProjectionMatrix();
  }

  let time = 0;
  function growth(b, dt, openAfter = 0.8) {
    b.age += dt;
    const g = clamp((b.age - b.delay) / 1.5);
    b.branch.scale.setScalar(Math.max(0.0001, g <= 0 ? 0.0001 : easeOutBack(g)));
    b.head.setOpen(easeOutCubic(clamp((b.age - b.delay - openAfter) / 1.4)));
  }
  function draw(now, dt) {
    time += dt;
    const playing = cinema.update(dt);
    const k = cinema.lightK();
    applyLight(k);
    branches.forEach((b) => {
      growth(b, dt);
      b.pulse = Math.max(0, b.pulse - dt * 1.5);
      b.head.group.scale.setScalar(b.size * (1 + 0.24 * Math.sin(Math.PI * b.pulse)));
      b.branch.rotation.z = REDUCE ? 0 : Math.sin(time * 0.7 + b.phase) * 0.012;
      b.branch.rotation.x = REDUCE ? 0 : Math.cos(time * 0.6 + b.phase) * 0.01;
    });
    fillers.forEach((b) => { growth(b, dt, 0.6); b.branch.rotation.z = REDUCE ? 0 : Math.sin(time * 0.6 + b.phase) * 0.02; });
    const g0 = branches[0].age;
    greens.group.scale.setScalar(Math.max(0.0001, easeOutBack(clamp((g0 - 0.1) / 1.2))));
    effects.driftMotes(dt, 0.35 + 0.65 * k, effects.motesColor, palette().light);
    effects.update(dt);
    if (!playing) controls.update(dt);
    renderer.render(scene, camera);
  }

  // Features.
  function replay() {
    branches.forEach((b, i) => { b.age = 0; b.delay = 0.45 + i * 0.05; });
    fillers.forEach((b, i) => { b.age = 0; b.delay = 1.0 + i * 0.07; });
    greens.group.scale.setScalar(0.0001);
    if (REDUCE) { branches.concat(fillers).forEach((b) => { b.age = 99; }); cinema.restingView(); return; }
    cinema.start();
  }
  function addMore() {
    if (branches.length >= MAX_FLOWERS) return false;
    const b = addFlower(branches.length, 0);
    b.age = 0;
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { if (!REDUCE) controls.autoRotate = true; }, 3500);
    return true;
  }
  function scatter() {
    const origins = branches.map((b) => { const p = new Vector3(); b.head.group.getWorldPosition(p); return p; });
    effects.scatter(origins, branches[Math.floor(Math.random() * branches.length)].mat, 60);
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
    const deep = cs.getPropertyValue('--cine-deep').trim() || '#120a0e';
    const glow = cs.getPropertyValue('--cine-glow').trim() || '#3a1626';
    const bg = c.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.8);
    bg.addColorStop(0, glow); bg.addColorStop(1, deep);
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.drawImage(canvas, 0, 0);
    c.fillStyle = '#f6e3b5';
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
  cinema.restingView();
  return {
    draw, resize, replay, addFlower: addMore, scatter, snapshot,
    count: () => branches.length,
    onInteract(fn) { onInteract = fn; },
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    /** hooks: { start, bars, end } fire during the opening shot. */
    onIntro(h) { Object.assign(introHooks, h); },
  };
}
