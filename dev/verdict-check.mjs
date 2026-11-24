// Developer check for api/verdict.js: wording, order, refusing bad input, and the "not set up" and health cases.
//   node dev/verdict-check.mjs
import handler, { parsePicks, buildMessage } from '../api/verdict.js';

let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); if (!ok) failed++; };
const res = () => { const r = { code: 0, body: null, headers: {} }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; r.setHeader = (k, v) => { r.headers[k] = v; }; return r; };

check('rejects an unknown option', parsePicks({ picks: ['nope'] }) === null);
check('rejects an empty list', parsePicks({ picks: [] }) === null);
check('rejects a long list', parsePicks({ picks: Array(31).fill('weird') }) === null);
check('accepts a JSON string body', JSON.stringify(parsePicks('{"picks":["weird"]}')) === '["weird"]');

const first = buildMessage(['notnow']);
check('first pick title', first.title === 'Verdict: first pick' && first.priority === 'high', JSON.stringify(first));
const second = buildMessage(['notnow', 'sweet']);
check('second pick lists the order', second.title === 'Verdict: pick #2' && second.text.includes('1. yeah nah') && second.text.includes('2. This is actually really sweet'));

delete process.env.NTFY_TOPIC;
let r = res(); await handler({ method: 'GET' }, r);
check('health says not configured', r.body.configured === false);
r = res(); await handler({ method: 'POST', body: { picks: ['weird'] } }, r);
check('POST without a topic is 503', r.code === 503);

process.env.NTFY_TOPIC = 'test-topic';
const sent = [];
globalThis.fetch = async (url, init) => { sent.push({ url, init }); return { ok: true }; };
r = res(); await handler({ method: 'GET' }, r);
check('health says configured', r.body.configured === true);
r = res(); await handler({ method: 'POST', body: { picks: ['lowkey', 'weird'] } }, r);
check('valid POST is sent to ntfy', r.code === 200 && sent.length === 1 && sent[0].url === 'https://ntfy.sh/test-topic');
check('title is plain ASCII', /^[\x20-\x7e]*$/.test(sent[0].init.headers.Title));
check('body carries both picks in order', sent[0].init.body.startsWith('This is straight up weird') && sent[0].init.body.includes('1. This is lowkey weird, thanks tho'));
r = res(); await handler({ method: 'POST', body: { picks: ['<script>'] } }, r);
check('bad option is refused and nothing sent', r.code === 400 && sent.length === 1);
r = res(); await handler({ method: 'PUT' }, r);
check('other methods are refused', r.code === 405);
globalThis.fetch = async () => ({ ok: false });
r = res(); await handler({ method: 'POST', body: { picks: ['sweet'] } }, r);
check('ntfy failure is reported as 502', r.code === 502);

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nall checks passed');
