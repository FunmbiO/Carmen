import { soundCard, codeBlock, nextLink } from '../parts.js';

export const goldenMarkup = `
  <div class="page-head">
    <span class="eyebrow"><em>III</em> Golden hour</span>
    <h2 class="page-title foil">Golden hour</h2>
    <p class="lead">Drag the sun. This is what you look like to me, from gold to night.</p>
  </div>
  <div class="stage frame">
    <span class="scroll-lane lane-l" aria-hidden="true"></span><span class="scroll-lane lane-r" aria-hidden="true"></span><canvas id="cv-golden" class="touch-surface" role="img" aria-label="A hilltop field at sunset. The sky moves from gold to honey to dusk to a night full of binary stars as the slider moves."></canvas>
  </div>
  <div class="slider">
    <input id="gSlider" class="touch-surface" type="range" min="0" max="100" value="22" aria-label="Time of day">
    <div class="ticks"><span>Gold</span><span>Honey</span><span>Sunset</span><span>Night</span></div>
  </div>
  <div class="cap" aria-live="polite">
    <p class="word foil" id="gWord">Gold.</p>
    <p class="capline" id="gLine">The first thing I think of when I think of you.</p>
  </div>
  ${codeBlock('sun.js', 'code-sun')}
  ${soundCard('golden')}
  ${nextLink('#after-dark')}
`;
