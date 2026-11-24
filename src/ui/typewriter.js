import { REDUCE } from '../lib/util.js';

// Types a code snippet (HTML with tags) into an element, once, the first time it is called.
const done = new WeakSet();

export function typeCode(el, html, { speed = 18, delay = 300 } = {}) {
  if (done.has(el)) return;
  done.add(el);
  if (REDUCE) { el.innerHTML = html; return; }
  el.innerHTML = '';
  const holder = document.createElement('span');
  const caret = document.createElement('span');
  caret.textContent = '▌';
  caret.className = 'caret';
  el.append(holder, caret);
  // Walk the markup: tags are written whole, only the visible characters are typed one by one.
  const parts = html.match(/<[^>]+>|&[a-z#0-9]+;|[\s\S]/gi) || [];
  let i = 0;
  let out = '';
  const tick = () => {
    if (i >= parts.length) return;
    out += parts[i++];
    while (i < parts.length && parts[i].startsWith('<')) out += parts[i++];
    holder.innerHTML = out; // an unclosed tag is closed by the browser, so half-typed markup still renders
    setTimeout(tick, speed);
  };
  setTimeout(tick, delay);
}
