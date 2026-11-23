import Typed from 'typed.js';
import { REDUCE } from '../lib/util.js';

// Types a code snippet into an element, once, the first time it is called.
const done = new WeakSet();

export function typeCode(el, html, { speed = 18, delay = 300 } = {}) {
  if (done.has(el)) return;
  done.add(el);
  if (REDUCE) { el.innerHTML = html; return; }
  el.innerHTML = '';
  const holder = document.createElement('span');
  el.appendChild(holder);
  new Typed(holder, { strings: [html], typeSpeed: speed, startDelay: delay, showCursor: true, cursorChar: '▌', contentType: 'html', smartBackspace: false });
}
