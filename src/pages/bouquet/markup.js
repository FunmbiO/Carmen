import { soundCard, nextLink } from '../parts.js';

export const bouquetMarkup = `
  <div class="page-head">
    <span class="eyebrow"><em>II</em> Bouquet</span>
    <h2 class="page-title foil">Seven flowers</h2>
    <p class="lead">Each one holds something I see in you. Tap them.</p>
  </div>
  <div class="stage frame arch">
    <canvas id="cv-bouquet" role="img" aria-label="A bouquet of seven code flowers tied with a gold ribbon in brown paper."></canvas>
  </div>
  <div class="chips" id="chips"></div>
  <div class="qcard panel chamfer tilt" aria-live="polite">
    <span class="qfn" id="qFn">// pick a flower</span>
    <h3 class="qtitle foil" id="qTitle">Start anywhere.</h3>
    <p class="qline" id="qLine">Every flower here is built from code, and every one means something.</p>
    <span class="qcode" id="qCode">&nbsp;</span>
  </div>
  <div class="prog"><span id="qProg">0 of 7 found</span><div class="bar"><i id="qBar"></i></div></div>
  <div class="done panel chamfer" id="qDone" hidden>
    <p class="foil">That’s the whole bouquet.</p>
    <a class="btn primary" href="#golden-hour">Continue</a>
  </div>
  ${soundCard('bouquet')}
  ${nextLink('#golden-hour', 'Continue', false)}
`;
