// Receives the answer she picks under "What's the verdict?" and pushes it to the site owner's phone through ntfy.
//
// The ntfy topic is a random secret kept in the NTFY_TOPIC environment variable, never in the code. The message only
// carries the wording of the option and the order of her picks. GET answers with whether notifications are set up.
import { REPLIES } from '../src/pages/dark/replies.js';

const LABELS = Object.fromEntries(REPLIES.map((r) => [r.id, r.label]));
const MAX_PICKS = 30;

/** The body is { picks: [id, ...] } in the order she tapped them. Anything else is refused. */
export function parsePicks(body) {
  let b = body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { return null; } }
  const picks = b && b.picks;
  if (!Array.isArray(picks) || picks.length < 1 || picks.length > MAX_PICKS) return null;
  if (!picks.every((id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(LABELS, id))) return null;
  return picks;
}

/** What the notification says. The wording comes from the server's own list, not from the request. */
export function buildMessage(picks) {
  const n = picks.length;
  const now = LABELS[picks[n - 1]];
  const title = n === 1 ? 'Verdict: first pick' : `Verdict: pick #${n}`;
  const text = n === 1 ? now : `${now}\n\nIn order: ${picks.map((id, i) => `${i + 1}. ${LABELS[id]}`).join('   ')}`;
  return { title, text, priority: n === 1 ? 'high' : 'default' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const topic = process.env.NTFY_TOPIC;
  if (req.method === 'GET') return res.status(200).json({ ok: true, configured: Boolean(topic) });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!topic) return res.status(503).json({ ok: false, error: 'notifications are not set up' });
  const picks = parsePicks(req.body);
  if (!picks) return res.status(400).json({ ok: false });
  const { title, text, priority } = buildMessage(picks);
  try {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: { Title: title, Priority: priority, Tags: 'seedling' }, // header values stay plain ASCII
      body: text,
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
