import { soundCard, nextLink } from '../parts.js';

export const bloomMarkup = `
  <div class="page-head">
    <span class="eyebrow"><em>I</em> Bloom</span>
    <h1 class="bloom-name script foil">Carmen</h1>
    <div class="gems"><span>Gold</span><i></i><span>Honey</span><i></i><span>Earth</span><i></i><span>Sunset</span></div>
    <p class="lead">I built you a bouquet out of code.</p>
    <p class="bouquet-note">I'm not gonna pretend as if I know that you like flowers. However, even if you did, it would be weirder to send some to you. So here's a digital bouquet I made by hand, and you can interact with it.</p>
  </div>
  <div class="stage frame stage-3d">
    <canvas id="cv-bloom" class="touch-surface" tabindex="0" role="img" aria-label="A bouquet of roses, daisies and tulips in kraft paper with a gold ribbon. Drag to turn it, tap a flower, and use the arrow keys to rotate."></canvas>
    <p class="stage-hint" id="bouquetHint">Drag to turn it &middot; Tap a flower</p>
    <p class="stage-fallback" id="bouquetFallback" hidden>Your browser can't draw the 3D bouquet. The rest of the page still works.</p>
  </div>
  <div class="row bouquet-tools">
    <button id="again" class="btn primary" type="button">Bloom again</button>
    <button id="addFlower" class="btn" type="button">Add a flower</button>
    <button id="scatter" class="btn" type="button">Let the petals go</button>
    <button id="snap" class="btn" type="button">Save a snapshot</button>
  </div>
  <span class="hint" id="bouquetCount" aria-live="polite">9 flowers</span>
  <div class="orn" aria-hidden="true"><i></i></div>
  <figure class="code panel">
    <figcaption><span>bouquet.js</span><span>◆</span></figcaption>
    <pre><code id="code-bloom"></code></pre>
  </figure>
  ${soundCard('bloom')}
  <p class="fine">Each page plays its own song. If your browser holds the music back, tap the record.</p>
  ${nextLink('#bouquet')}
`;

export const bloomCode = `<span class="k">const</span> bouquet = <span class="k">new</span> <span class="f">Bouquet</span>({
  flowers: <span class="n">9</span>,
  wrap: <span class="n">'kraft'</span>,
  ribbon: <span class="n">'gold'</span>,
  madeBy: <span class="n">'hand'</span>, <span class="c">// not a template</span>
});

bouquet.<span class="f">give</span>(carmen);`;
