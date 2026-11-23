import { soundCard, codeBlock } from '../parts.js';

export const darkMarkup = `
  <span class="eyebrow"><em>IV</em> After dark</span>
  <div class="banner frame">
    <canvas id="cv-dark" role="img" aria-label="Golden and green code symbols falling like rain. Tapping makes them rush."></canvas>
    <div class="over"><h2 class="page-title foil">After dark</h2></div>
  </div>
  <article class="letter panel chamfer" aria-label="A letter for Carmen">
    <p class="salute script foil">Carmen,</p>
    <p class="reveal-lines">We don't know each other well yet, and I know you're not looking for anything right now. But some people leave an impression before they say a word, and you did. You come across as luxury, class and love in one place. You remind me of gold, honey, earth and sunset, so that's what I built.</p>
    <p class="reveal-lines">I think you're a sweet goddess, a pearl. I'm not asking for anything today. If someday you feel like giving me a chance to know you, I'd be honored.</p>
    <div class="sig"><span class="signame script">Funmbi</span><span class="seal script" aria-hidden="true">F</span></div>
  </article>
  <div class="ask panel chamfer">
    <h3 class="foil">Would you ever give me a chance?</h3>
    <div class="row">
      <button id="yes" class="btn primary" type="button">Maybe someday</button>
      <button id="no" class="btn" type="button">Not right now</button>
    </div>
    <p class="answer" id="answer" aria-live="polite">&nbsp;</p>
  </div>
  ${codeBlock('chance.js', 'code-chance')}
  ${soundCard('dark')}
  <div class="row"><a class="btn" href="#bloom">Back to the flower</a></div>
`;

export const chanceCode = `<span class="k">if</span> (you.<span class="f">feelsLikeIt</span>()) {
  chance.<span class="f">give</span>(funmbi);
} <span class="c">// no pressure</span>`;
