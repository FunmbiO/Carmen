import { soundCard, nextLink } from '../parts.js';

export const bloomMarkup = `
  <div class="page-head">
    <span class="eyebrow"><em>I</em> Bloom</span>
    <h1 class="bloom-name script foil">Carmen</h1>
    <div class="gems"><span>Gold</span><i></i><span>Honey</span><i></i><span>Earth</span><i></i><span>Sunset</span></div>
    <p class="lead">I built you a flower out of code.</p>
  </div>
  <div class="stage frame">
    <canvas id="cv-bloom" role="img" aria-label="A glowing gold flower with a centre made of code symbols, growing at dusk beside smaller flowers and fireflies."></canvas>
  </div>
  <div class="row">
    <button id="again" class="btn primary" type="button">Bloom again</button>
    <button id="plant" class="btn" type="button">Plant one</button>
  </div>
  <span class="hint">Tap the garden to plant more flowers.</span>
  <div class="orn" aria-hidden="true"><i></i></div>
  <figure class="code panel">
    <figcaption><span>carmen.js</span><span>◆</span></figcaption>
    <pre><code id="code-bloom"></code></pre>
  </figure>
  ${soundCard('bloom')}
  <p class="fine">Each page plays its own song. If your browser holds the music back, press play on the player.</p>
  ${nextLink('#bouquet')}
`;

export const bloomCode = `<span class="k">const</span> carmen = <span class="k">new</span> <span class="f">Flower</span>({
  petals: <span class="n">8</span>,
  layers: <span class="n">5</span>,
  hue: <span class="n">42</span>, <span class="c">// honey</span>
  seed: <span class="f">goldenAngle</span>, <span class="c">// 137.5°</span>
});

carmen.<span class="f">bloom</span>();`;
