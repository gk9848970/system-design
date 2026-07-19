# Unit 6 — Security Review Summary

Review lens over the stock-trading frontend (subdomains + SSO + shared WebSockets).
Meta-lesson: **auth is never "done" — each layer just shrinks the attack surface for the next one.**

---

## Cookie flags (Unit 1)
- **Observed:** HttpOnly ✓, Secure ✗ (fine on local http), SameSite=Lax.
- **Verdict:** Lax kills classic CSRF; HttpOnly stops token *theft* but not token *use* — an XSS payload inside your origin can still call `apiFetch` and the cookie rides along.
- **Lax gaps:** state-changing GETs still carry the cookie; subdomains are same-*site* so they sit inside the perimeter.

## Single-flight refresh (Unit 2)
- The `refresh-token` localStorage key held a harmless timestamp, but the *shape* was "credential in localStorage" — a footgun waiting to be promoted.
- **Fix:** `/refresh` returns `Set-Cookie` only; the lock winner writes a `session-refreshed-at` signal; `ensureFreshSession()` returns void — no token ever in JS reach.

## Subscription union (Unit 4)
- localStorage is **untrusted input** (XSS shares your origin).
- **Fix:** leader validates on read (array-of-strings, symbol regex `^[A-Z]{1,5}$`, length cap) before replaying to the socket.
- Worst case dropped from replay-flood / protocol injection down to stale-or-missing symbols.

## CSP
- Fights XSS one step earlier than everything above.
- `script-src 'self'` blocks injected/inline script execution; `connect-src 'self' + WS origin` cuts the exfiltration channel.
- Production only — Vite dev needs inline scripts for HMR.

## Socket auth (Unit 3)
- The WebSocket handshake is an ordinary HTTP request, so a **same-origin `.lvh.me` socket gets the HttpOnly cookie for free**.
- **Fix:** server validates the cookie in the connection handler, `ws.close(1008)` if invalid, tags `ws.userId`.
- **Trap:** token-in-URL (`?token=...`) leaks into server logs and browser history — use cookie-on-handshake or token-in-first-message instead.

## Revocation
- Handshake auth is a **door check, not a leash** — the socket outlives logout.
- **Fix = two closes:**
  - **Server-side force-close** — the only thing that stops a stolen session (an attacker won't run your client logout code).
  - **Client-side teardown** — coordinates your own tabs.
- **Gotcha:** BroadcastChannel *and* the `storage` event are both same-origin, so a `portfolio.` logout never reaches a `trade.` leader. Make the server-side socket close double as the cross-origin signal; the leader then rebroadcasts to same-origin tabs.

## Admin subdomain (reasoned, not built)
- Never share the `.lvh.me` SSO cookie with admin.
- **Fix:** scope the admin session host-only to `admin.lvh.me` + a separate session (not an `isAdmin` flag on the shared cookie) + step-up / re-auth for destructive actions.
- Then a `trade.` XSS foothold can't reach admin privilege — blast radius stops at the boundary.
