import { clamp } from '../../lib/util.js';

// The opening shot: a low, close camera under the bouquet that arcs round and pulls back to the resting view
// while the light rises. About five seconds. A tap skips it.

const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const CINEMA = {
  DUR: 4.8,
  AZ0: 1.35, AZ1: 0.12, // sideways angle: from the side to nearly head-on
  POL0: 2.0, POL1: 1.42, // looking up from below, then eye level
  R0: 3.7, // starting distance; the end distance comes from the frame size
  TY0: 0.8, TY1: 0.12, // what the camera looks at
  FOV0: 24, FOV1: 35, // a slow zoom-out as it pulls back
};

export function createCinema({ camera, controls, target, getDist, hooks = {} }) {
  const state = { on: false, t: 0 };

  function place(az, pol, r, ty) {
    target.set(0, ty, 0);
    camera.position.set(r * Math.sin(pol) * Math.sin(az), ty + r * Math.cos(pol), r * Math.sin(pol) * Math.cos(az));
    camera.lookAt(target);
  }

  function restingView() {
    camera.fov = CINEMA.FOV1;
    camera.updateProjectionMatrix();
    place(CINEMA.AZ1, CINEMA.POL1, getDist(), CINEMA.TY1);
    controls.target.copy(target);
  }

  function start() {
    state.on = true;
    state.t = 0;
    controls.enabled = false;
    controls.autoRotate = false;
    if (hooks.start) hooks.start();
  }

  function finish() {
    state.on = false;
    restingView();
    controls.enabled = true;
    controls.update();
    if (hooks.end) hooks.end();
  }

  /** Advance the shot. Returns true while it is playing. */
  function update(dt) {
    if (!state.on) return false;
    state.t += dt;
    const p = clamp(state.t / CINEMA.DUR);
    const e = easeInOutCubic(p);
    place(lerp(CINEMA.AZ0, CINEMA.AZ1, e), lerp(CINEMA.POL0, CINEMA.POL1, e), lerp(CINEMA.R0, getDist(), e), lerp(CINEMA.TY0, CINEMA.TY1, e));
    camera.fov = lerp(CINEMA.FOV0, CINEMA.FOV1, e);
    camera.updateProjectionMatrix();
    if (p >= 1) finish();
    return true;
  }

  return {
    start, update, restingView,
    skip() { if (state.on) state.t = CINEMA.DUR; },
    /** 0..1: how much light the scene has. It rises during the shot. */
    lightK: () => (state.on ? 0.18 + 0.82 * easeOutCubic(clamp((state.t - 0.25) / 2.4)) : 1),
    get active() { return state.on; },
    get time() { return state.t; },
  };
}
