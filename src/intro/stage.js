import {
  WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Points, Color,
  AdditiveBlending, NormalBlending,
} from 'three';
import { buildFlowerGeometry } from './flower-points.js';
import { vertex, fragment } from './shaders.js';
import { palette } from '../lib/theme.js';

// The Three.js side of the intro: one Points object, one render loop, colours that follow the theme.
const FOV = 40;

const COLORS = {
  noir: { base: '#e7c26a', hi: '#fff4cf' },
  terra: { base: '#e9a93b', hi: '#ffe2a8' },
  ivory: { base: '#5a1624', hi: '#b08d3e' },
};

export function createStage(canvas) {
  const small = window.innerWidth < 640;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  const geo = buildFlowerGeometry(small ? 5200 : 9500);

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uExplode: { value: 0 },
    uScale: { value: 600 },
    uColor: { value: new Color('#e7c26a') },
    uHi: { value: new Color('#fff4cf') },
  };
  const mat = new ShaderMaterial({
    uniforms, vertexShader: vertex, fragmentShader: fragment,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const points = new Points(geo, mat);
  scene.add(points);

  function applyTheme() {
    const P = palette();
    const c = COLORS[P.id];
    uniforms.uColor.value.set(c.base);
    uniforms.uHi.value.set(c.hi);
    mat.blending = P.light ? NormalBlending : AdditiveBlending;
    mat.needsUpdate = true;
  }

  function resize() {
    const w = canvas.parentElement.clientWidth || window.innerWidth;
    const h = canvas.parentElement.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the flower to the narrower side, then lift it above the text block.
    const half = Math.tan((FOV * Math.PI) / 360);
    const need = 2.5 / (2 * half * Math.min(1, camera.aspect));
    camera.position.set(0, 0, Math.max(4.6, need));
    camera.updateProjectionMatrix();
    const visH = 2 * half * camera.position.z;
    // Wide screens: smaller flower, higher, so the greeting has the lower half to itself.
    const wide = camera.aspect > 1.1;
    points.scale.setScalar(wide ? 0.66 : 1);
    points.position.y = visH * (wide ? 0.22 : 0.16);
    uniforms.uScale.value = (h * dpr) / (2 * half);
  }

  let raf = 0;
  let t0 = performance.now();
  function frame(now) {
    uniforms.uTime.value = (now - t0) / 1000;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  applyTheme();
  resize();
  window.addEventListener('resize', resize);

  return {
    uniforms,
    applyTheme,
    resize,
    start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geo.dispose(); mat.dispose(); renderer.dispose();
    },
  };
}
