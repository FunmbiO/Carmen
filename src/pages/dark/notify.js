// Tells the site owner which answer she picked under "What's the verdict?", in the order she picked them.
//
// Every new pick sends the whole ordered list so far, so the first pick is always clear. Picking the same option twice
// in a row is not sent again. If a send fails because she is offline, it is kept and retried the next time the page
// loads or the connection returns. Her picks are remembered in the browser so the order survives a reload.

const KEY = 'carmen-verdict';
const MAX_PENDING = 20;
let memory = { picks: [], pending: [] }; // used when storage is blocked

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.picks) && Array.isArray(s.pending)) return s;
  } catch { /* storage blocked or unreadable */ }
  return memory;
}
function write(s) {
  memory = s;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

/** Returns true if the send worked, or should not be retried; false if it should be tried again later. */
async function post(picks) {
  try {
    const r = await fetch('/api/verdict', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ picks }), keepalive: true,
    });
    return r.status < 500; // a 4xx means the request itself is wrong, so retrying would not help
  } catch {
    return false; // offline
  }
}

/** Retry anything that did not get through, oldest first. */
export async function flushPending() {
  const s = read();
  if (!s.pending.length) return;
  const rest = [];
  for (const picks of s.pending) {
    if (rest.length || !(await post(picks))) rest.push(picks); // keep the order: stop at the first failure
  }
  write({ ...read(), pending: rest });
}

/** Call when she taps an option. */
export async function recordPick(id) {
  const s = read();
  if (s.picks[s.picks.length - 1] === id) return; // the same option again
  const picks = [...s.picks, id];
  write({ ...s, picks });
  if (!(await post(picks))) {
    const cur = read();
    write({ ...cur, pending: [...cur.pending, picks].slice(-MAX_PENDING) });
  }
}

export function watchConnection() {
  window.addEventListener('online', flushPending);
  flushPending();
}
