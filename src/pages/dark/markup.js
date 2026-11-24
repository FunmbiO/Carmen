import { soundCard, codeBlock } from '../parts.js';
import { REPLIES } from './replies.js';

const replyButtons = REPLIES.map((r) => `<button class="reply" type="button" data-reply="${r.id}" aria-pressed="false">${r.label}</button>`).join('');

export const darkMarkup = `
  <span class="eyebrow"><em>IV</em> After dark</span>
  <div class="banner frame">
    <canvas id="cv-dark" role="img" aria-label="Golden and green code symbols falling like rain. Tapping makes them rush."></canvas>
    <div class="over"><h2 class="page-title foil">After dark</h2></div>
  </div>
  <article class="letter panel chamfer" aria-label="A letter for Carmen">
    <p class="salute script foil">Carmen,</p>
    <p class="reveal-lines">We don't know each other well/at all, and I know you're not looking for anything right now (Heard). There’s also so much I can do and say online before it’s straight up weird and parasocial.</p>
    <p class="reveal-lines">That being said, take this whole thing with a grain of salt. I do think you're genuinely a ray of sunshine and I feel honoured that I’m even given the time of day to pull this stunt, lmao. However this isn’t me hitting on you at all, I just turned how I felt into a fun project.</p>
    <p class="reveal-lines">Anyhow, I’m not on any weird typa timing. After this I won’t move any differently than before. Pinky promise.</p>
    <p class="reveal-lines letter-close">Hope to meet you some day.</p>
    <div class="sig"><span class="signame script">Funmbi</span><span class="seal script" aria-hidden="true">F</span></div>
  </article>
  <div class="ask panel chamfer" role="group" aria-label="Your reply">
    <h3 class="verdict foil">What’s the verdict?</h3>
    <div class="replies">${replyButtons}</div>
    <p class="answer" id="answer" aria-live="polite">&nbsp;</p>
    <p class="verdict-note">Whichever you tap gets sent to me.</p>
  </div>
  ${codeBlock('promise.js', 'code-chance')}
  ${soundCard('dark')}
  <div class="row"><a class="btn" href="#bloom">Back to the flower</a></div>
`;

export const chanceCode = `<span class="k">if</span> (you.<span class="f">feelsLikeIt</span>()) {
  hello.<span class="f">say</span>();
} <span class="k">else</span> {
  nothing.<span class="f">changes</span>(); <span class="c">// pinky promise</span>
}`;
