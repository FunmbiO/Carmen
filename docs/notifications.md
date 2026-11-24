# Verdict notifications

When she taps an answer under "What's the verdict?", the site owner gets a push notification on their phone, with the answer and the order of her picks.

## How it works

1. `src/pages/dark/notify.js` records each pick in order (kept in the browser, so the order survives a reload) and sends the whole ordered list to `/api/verdict`. Picking the same option twice in a row is not sent again. If she is offline, the pick is queued and sent when the connection returns.
2. `api/verdict.js` is a small server function. It checks the picks against the real option list, then posts a message to [ntfy](https://ntfy.sh), a free push service that needs no account.
3. The first pick arrives as **Verdict: first pick**. Every later pick arrives as **Verdict: pick #2**, **#3** and so on, and lists everything in order, for example `In order: 1. yeah nah   2. This is actually really sweet`.

Only the wording of the option and the order are sent. There is no name, address or other detail in the message.

## Setting it up (one time)

The notification topic is a long random secret. It is **not** in the code. It lives in the `NTFY_TOPIC` environment variable on the Vercel project (Settings, Environment Variables).

1. Install the ntfy app (iPhone or Android), or open ntfy.sh in a browser.
2. Subscribe to the topic. The server is the default, ntfy.sh. Allow notifications.
3. To check the wiring without sending anything, open `/api/verdict` on the site. It answers `{"ok":true,"configured":true}` when the topic is set.

Anyone who knows the topic could read the messages, so keep it private. To change it, set a new random value for `NTFY_TOPIC` in Vercel, redeploy, and subscribe to the new topic.

## Using a different channel

Only `api/verdict.js` knows about ntfy. To send email, Telegram or something else instead, change the `fetch` call in that file. Everything else stays the same.

## Checks

- `node dev/verdict-check.mjs` tests the function: the wording, the order, bad input and the "not set up" case.
