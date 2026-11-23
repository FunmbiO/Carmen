import { gsap } from 'gsap';
import { createStage } from './stage.js';
import { mountThemeSwitch } from '../ui/theme-switch.js';
import { onTheme } from '../lib/theme.js';
import { REDUCE } from '../lib/util.js';
import { playPage } from '../ui/music.js';

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

const MARKUP = `
  <div class="intro-glow"></div>
  <canvas class="intro-canvas" aria-hidden="true"></canvas>
  <div class="intro-grain"></div>
  <div class="intro-top"><span class="tag">For Carmen</span><div id="intro-theme"></div></div>
  <div class="intro-copy">
    <p class="intro-eyebrow">A small gift, built in code</p>
    <h1 class="intro-name script foil"><span>Hey Carmen,</span><i class="intro-nib"></i></h1>
    <p class="intro-sub">I built you something.</p>
    <div class="intro-cta">
      <button class="btn primary chamfer" id="intro-enter" type="button">Enter ${ARROW}</button>
      <span class="intro-hint">Best with sound on</span>
    </div>
  </div>
  <button class="intro-skip" id="intro-skip" type="button">Tap to skip</button>
`;

/** Plays the opening. Resolves when the visitor has entered and the screen is gone. */
export function playIntro() {
  return new Promise((resolve) => {
    const root = document.getElementById('intro');
    root.innerHTML = MARKUP;
    root.hidden = false;
    const q = (s) => root.querySelector(s);
    const stage = createStage(q('.intro-canvas'));
    const u = stage.uniforms;
    mountThemeSwitch(q('#intro-theme'));
    const off = onTheme(() => stage.applyTheme());
    stage.start();

    const name = q('.intro-name');
    const nib = q('.intro-nib');
    const skip = q('#intro-skip');
    let entered = false;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (REDUCE) {
      u.uProgress.value = 1;
      gsap.set([q('.intro-glow'), q('.intro-top'), q('.intro-eyebrow'), q('.intro-sub'), q('.intro-cta')], { opacity: 1 });
    } else {
      gsap.set(name, { clipPath: 'inset(-10% 100% -25% -4%)' });
      tl.fromTo(q('.intro-glow'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 3, ease: 'power2.out' }, 0)
        .to(u.uProgress, { value: 1, duration: 3.6, ease: 'power2.inOut' }, 0.4)
        .to(q('.intro-top'), { opacity: 1, duration: 1.2 }, 2.4)
        .to(q('.intro-eyebrow'), { opacity: 1, duration: 1 }, 2.8)
        .to(name, { clipPath: 'inset(-10% -4% -25% -4%)', duration: 2.1, ease: 'power2.inOut' }, 3.2)
        .fromTo(nib, { left: '2%', opacity: 0 }, { left: '98%', duration: 2.1, ease: 'power2.inOut' }, 3.2)
        .to(nib, { opacity: 1, duration: 0.25 }, 3.2)
        .to(nib, { opacity: 0, duration: 0.5 }, 5.1)
        .fromTo(q('.intro-sub'), { y: 14 }, { y: 0, opacity: 1, duration: 1.2 }, 5.2)
        .fromTo(q('.intro-cta'), { y: 14 }, { y: 0, opacity: 1, duration: 1 }, 6.0)
        .to(skip, { opacity: 0.8, duration: 0.6 }, 1.2)
        .to(skip, { opacity: 0, duration: 0.4 }, 6.0);
    }

    skip.addEventListener('click', () => tl.timeScale(6));
    q('.intro-canvas').addEventListener('pointerdown', () => { if (tl.time() < 6) tl.timeScale(6); });

    q('#intro-enter').addEventListener('click', () => {
      if (entered) return;
      entered = true;
      playPage('bloom'); // started inside this tap, which is what lets the browser play it
      const out = gsap.timeline({
        onComplete() {
          off();
          stage.dispose();
          root.hidden = true;
          root.innerHTML = '';
          resolve();
        },
      });
      out.to(u.uExplode, { value: 1, duration: 1.5, ease: 'power2.in' }, 0)
        .to(root.querySelector('.intro-copy'), { opacity: 0, y: -24, duration: 0.7, ease: 'power2.in' }, 0)
        .to(root.querySelector('.intro-top'), { opacity: 0, duration: 0.5 }, 0)
        .to(root.querySelector('.intro-glow'), { opacity: 0, scale: 1.5, duration: 1.2 }, 0)
        .to(root, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 0.8);
    });
  });
}
