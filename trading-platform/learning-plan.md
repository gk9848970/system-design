# Frontend System Design — Stock Trading Platform
## A Build-It-Piece-By-Piece Learning Plan

You'll learn this in **6 focused units + 1 synthesis session**. Each unit is self-contained: you can open a brand-new chat, paste the "Session primer" for that unit, and build it in isolation against a mock — no real backend, no other units required. The final session is where you assemble everything and answer the original interview question end to end.

---

## How to use this document

No time limit, no fixed order. Pick your path from the dependency map below — most units are free-standing entry points. Then:

1. For each unit, start a **fresh session**, paste the **Session primer**, and build the deliverable.
2. Don't move on until you hit the unit's **"Done when"** checklist. Then go as deep as you like via **"Go deeper"**.
3. Keep a one-paragraph **learning log** per unit (what surprised you, what you'd do differently). You'll reread these before the synthesis.
4. When you've covered the units you want, do the **Synthesis session**: solve the whole question, no mocks-as-crutch.

The goal is *not* a polished app. It's a set of small, ugly, working demos that each prove you understand one primitive — and, since you have the time, a few that go deep enough to be genuinely hard.

---

## Dependency map — choose your own path

Only one real dependency exists. Most units stand alone:

```
Unit 1  Auth / SSO ............... standalone entry point
Unit 2  Coordination ............ standalone entry point  (keystone — most reused)
Unit 3  WebSocket lifecycle ..... standalone entry point
Unit 5  Performance ............. standalone entry point  (fake firehose, needs nothing)

Unit 4  Shared socket ........... requires 2 + 3
Unit 6  Security (lens) ......... best after 1, 3, 4 exist to review
```

So your only hard rule is: **build 2 and 3 before 4**, and do **6 late** (it reviews the others). Everything else is your call.

Three sensible paths, depending on what you want most:
- **Curiosity-led (recommended):** whatever sounds most interesting first. They're independent; follow energy.
- **Build-up-to-the-payoff:** 2 → 3 → 4 first (the satisfying composition), then 1, 5, 6.
- **Breadth-first then depth:** clear all six "Done when" checklists fast, *then* circle back through "Go deeper" on the ones you found most interesting. Good if you like seeing the whole shape before drilling.

---

## The mental model to carry through everything

Two ideas tie all eight requirements together. Hold onto them:

1. **Coordination is the shared primitive.** "Cross-tab logout sync" and "one shared WebSocket for all tabs" are the *same mechanism* — getting independent browser contexts to agree and elect one actor. Learn it once (Unit 2), reuse it twice.

2. **Token-refresh coordination and socket coordination are the same shape:** *one actor does the work, everyone else consumes the result.* Three tabs hitting an expired token should produce **one** refresh call (others wait), exactly like three tabs should share **one** socket. Single-flight / leader election solves both.

If you can articulate those two sentences in the interview, you've shown the senior-level insight the question is fishing for.

---

## One-time setup (do before Unit 1)

- **Subdomains without pain:** use `lvh.me` or `localtest.me`. Both resolve `*.lvh.me` → `127.0.0.1` automatically, so `trade.lvh.me`, `portfolio.lvh.me`, `admin.lvh.me` all just work locally with **no `/etc/hosts` edits**. This is essential for testing cross-subdomain cookies.
- **Stack:** Vite + React + TypeScript. Keep it minimal.
- **Mock servers:** a ~40-line Node script per unit that needs one (auth, websocket). I'll spec these inside each unit so you build them as part of learning.
- **Browser:** Chrome with DevTools → Application tab (Cookies, Storage) and the Network tab (WS frames) open constantly. Half the learning is *watching* what the browser does.

---

## Unit 1 — Authentication & SSO

**Goal:** Log in once, be logged in across `trade.`, `portfolio.`, `admin.` — and understand exactly *why* it works.

**Session primer (paste into a fresh chat):**
> I'm learning frontend system design by building isolated pieces. This session: **authentication & SSO across subdomains** for a React app. I want to deeply understand cookie-based sessions vs token-based (JWT access + refresh), why a cookie scoped to `.lvh.me` is shared across subdomains while an in-memory/localStorage token is not, and how silent token auto-refresh works. Help me build a tiny mock auth server + a minimal React app served on `trade.lvh.me` and `portfolio.lvh.me` that demonstrates real SSO. Teach as we go; don't just dump a finished app.

**Concepts to nail:**
- Cookie vs token storage, and the *security* tradeoff of each (httpOnly cookie → safe from XSS but needs CSRF defense; localStorage token → XSS-readable; in-memory → safest but lost on reload).
- Cookie `Domain` attribute: `.lvh.me` vs `trade.lvh.me`. This single attribute *is* SSO.
- Access token (short-lived) + refresh token (long-lived, rotated). Why split them.
- Silent refresh: refresh *before* expiry, or refresh-on-401-then-retry.

**Build:**
- Mock auth server (Node/Express): `/login` sets an httpOnly cookie on `Domain=.lvh.me`; `/refresh` rotates it; `/me` returns the user if the cookie is valid.
- React app served at two subdomains. Log in on one → reload the other → already authenticated.

**Done when:**
- [ ] You log in on `trade.lvh.me`, open `portfolio.lvh.me`, and you're already authed — and you can explain *which attribute* made that happen.
- [ ] You can articulate why this would **fail** if the token lived in `localStorage`.
- [ ] Auto-refresh works silently and you've watched it in the Network tab.

**Stretch:** Implement refresh as **refresh-on-401-with-retry** and notice the problem it creates — concurrent 401s firing multiple refreshes. Don't solve it yet. *Name it.* You'll fix it in Unit 2.

**Connective tissue:** The "multiple concurrent refreshes" problem you just hit is the same single-flight problem as the shared socket. Park it.

**Go deeper (no rush):**
- **Refresh token rotation + reuse detection.** When you rotate a refresh token, the old one should be invalidated; if it's ever used again, that signals theft → revoke the whole family. Implement it in your mock server. This is the real-world hard part of refresh tokens.
- **The BFF (Backend-for-Frontend) pattern.** Instead of the browser ever holding tokens, a thin server-side layer holds them and the browser only carries an opaque session cookie. Build a minimal version and compare its threat model to the in-browser-token approach. This is increasingly the "correct" answer for high-security apps like trading.
- **Real OIDC flow.** Implement Authorization Code + PKCE against a mock identity provider so you understand what "SSO" means at the protocol level, not just the cookie level.

---

## Unit 2 — Cross-context coordination (the keystone)

**Goal:** Make independent tabs talk, agree, and elect one leader. This is the most reusable unit; spend real time here.

**Session primer:**
> I'm learning frontend system design in isolated pieces. This session: **cross-tab / cross-context coordination** in the browser. I want hands-on understanding of BroadcastChannel, the `storage` event, SharedWorker, and the Web Locks API — and crucially the difference between *same-origin* (cross-tab) and *cross-origin* (cross-subdomain) coordination. Help me build small demos for each, plus a **leader election** demo where exactly one tab is "the leader" and leadership hands off when it closes. Teach the tradeoffs; don't hand me a finished lib.

**Concepts to nail:**
- **BroadcastChannel** — easy pub/sub, but **same-origin only** (does NOT cross subdomains).
- **`storage` event** — older cross-tab signal, also same-origin.
- **Web Locks API** (`navigator.locks`) — the clean way to do leader election and single-flight.
- **SharedWorker** — one worker instance shared by all same-origin tabs; a natural place to own shared resources.
- The boundary that trips everyone up: **cross-tab ≠ cross-subdomain.** Crossing subdomains needs a shared cookie, a hidden common-origin iframe broker, or the server. Get crisp on this.

**Build:**
- Demo A: BroadcastChannel chat between tabs.
- Demo B: leader election via Web Locks — open 5 tabs, exactly one shows "I am leader," close it, another takes over within a second.
- Demo C: single-flight — 5 tabs "need a token," exactly one does the (mock) async work, the other four receive the result without firing their own.

**Done when:**
- [ ] Five tabs, exactly one leader, clean handoff on close.
- [ ] Single-flight works — you've proven only one actor did the work.
- [ ] You can explain why BroadcastChannel won't sync logout from `trade.lvh.me` to `admin.lvh.me`, and name two ways to bridge that gap.

**Connective tissue:** Demo C *is* the Unit 1 refresh fix. Demo B *is* the Unit 4 shared-socket owner. You now hold the keystone.

**Go deeper (no rush):**
- **Roll your own leader election** without Web Locks — using only BroadcastChannel + heartbeats + timeouts (a simplified bully algorithm). Then handle the nasty cases: leader *crashes* (no clean close event) vs leader *closes cleanly*, and **split-brain** (two tabs both think they're leader during a network hiccup). Doing this by hand is what makes you actually understand why Web Locks exists.
- **Compare all four mechanisms** in a written table from your own experience: BroadcastChannel, `storage` event, SharedWorker, Web Locks — latency, browser support, what each can't do.
- **Cross-subdomain bridge.** Build the hidden-iframe broker: a common-origin iframe embedded in each subdomain that relays messages, so `trade.` and `admin.` *can* coordinate. This is the piece that makes cross-subdomain logout real.

---

## Unit 3 — WebSocket lifecycle

**Goal:** A single robust socket: connect, heartbeat, detect death, reconnect with backoff, resubscribe.

**Session primer:**
> I'm learning frontend system design in isolated pieces. This session: **robust WebSocket lifecycle management** in a React app, for streaming stock prices. I want to understand open/message/close/error handling, heartbeat/ping-pong to detect a dead connection, **reconnect with exponential backoff + jitter**, and **resubscribing** to symbols after a reconnect (the new socket forgot my subscriptions). Help me build a ~40-line mock WS server that streams fake ticks, plus a React hook that manages one resilient connection. Teach the failure modes; make me kill the server to see them.

**Concepts to nail:**
- The four events and what each really means (a `close` isn't always clean; `error` is often vague).
- **Heartbeat:** why TCP/`onclose` alone won't reliably tell you the link is dead; app-level ping/pong + timeout.
- **Exponential backoff + jitter:** why fixed-interval reconnect causes thundering-herd, why jitter matters.
- **Resubscription:** the server has no memory of your subscriptions after reconnect — you must replay them.

**Build:**
- Mock WS server (Node `ws`): accepts `subscribe`/`unsubscribe`, streams random-walk prices for subscribed symbols, supports ping/pong.
- A `useStockSocket` hook owning one connection with all of the above.

**Done when:**
- [ ] Kill the server → client backs off (you can see growing delays) → restart → client reconnects **and resubscribes** automatically.
- [ ] Heartbeat detects a silently dead connection (simulate by pausing the server) faster than the browser's own timeout.

**Connective tissue:** This is your "reconnect strategies" requirement, fully handled. Next unit makes *one* of these shared by all tabs.

**Go deeper (no rush) — this is the unit most worth over-investing in for a *trading* interview:**
- **Snapshot + delta with sequence numbers.** Real market-data feeds don't send full state every tick. They send a *snapshot* on subscribe, then *incremental deltas*, each stamped with a monotonically increasing sequence number. The client detects a **gap** (a missing sequence) and triggers a **resync** (re-request the snapshot). Build this. It's exactly how Binance/Coinbase order-book feeds work, and casually mentioning "snapshot-then-delta with gap detection" in the interview is a strong signal.
- **Backpressure.** When updates arrive faster than you can process, what do you drop and how? (Connects to Unit 5's coalescing.)
- **Binary frames.** Stream as binary (e.g. a compact encoding) instead of JSON and measure the parse-cost difference at high volume.
- **Reconnect correctness:** after a reconnect, you must replay subscriptions *and* re-fetch snapshots, because you may have missed deltas while disconnected. Make sure your reconnect doesn't silently leave stale data on screen.

---

## Unit 4 — One shared WebSocket across all tabs

**Goal:** N tabs, **one** socket. The leader owns it and fans data out; leadership (and the socket) hand off when the leader closes.

**Session primer:**
> I'm learning frontend system design in isolated pieces. This session **composes two things I've already built**: a robust single WebSocket (lifecycle, backoff, resubscribe) and browser leader-election (Web Locks). Goal: across many tabs of the same app there should be **exactly one** WebSocket; the leader tab owns it and broadcasts ticks to follower tabs via BroadcastChannel (or I host the socket in a SharedWorker). When the leader closes, another tab must take over the socket seamlessly. Help me reason about the SharedWorker-owns-socket approach vs leader-tab-owns-socket approach and build one. Assume I already understand Web Locks, BroadcastChannel, and WS lifecycle.

**Concepts to nail:**
- Two architectures: **(a) leader tab owns the socket**, broadcasts to followers; **(b) SharedWorker owns the socket** for all tabs. Tradeoffs: SharedWorker is cleaner but has weaker browser support (notably not in some mobile/Safari contexts) and is harder to debug.
- Subscription **fan-in:** followers ask the leader to subscribe; leader maintains the union of all tabs' interests.
- **Handoff:** new leader must re-open the socket and replay the union of subscriptions.

**Build:** Pick architecture (a) first (more portable, easier to see). Open 4 tabs → DevTools shows **one** WS connection total → close the leader → a new tab opens the socket, no visible gap in ticks.

**Done when:**
- [ ] Network tab confirms exactly one WS across all open tabs.
- [ ] Closing the leader transfers socket ownership automatically.
- [ ] Each tab only "sees" the symbols it cares about, but the socket carries the union.

**Connective tissue:** "Minimal WebSocket connections across many tabs" — done. This is Unit 2's leader election applied to Unit 3's socket. Feel the reuse.

**Go deeper (no rush):**
- **Build architecture (b) too** — SharedWorker owns the socket — and write up the head-to-head: leader-tab is portable but the socket dies briefly on handoff; SharedWorker has no handoff problem but weaker support and harder debugging. Then build a **fallback chain**: SharedWorker if available, else leader-tab election.
- **Handoff correctness.** During leadership transfer, in-flight subscriptions and unacked messages can be lost or duplicated. Make the handoff lossless: new leader replays the subscription union *and* re-snapshots (ties into Unit 3's resync).
- **Subscription reference-counting.** Two tabs watch AAPL; one closes; the socket should keep AAPL subscribed (one tab still wants it). Get the ref-counting right across tab churn.

---

## Unit 5 — High-frequency updates & rendering performance

**Goal:** A firehose of ticks updates a big table at 60fps without melting the main thread. No real socket needed — generate a fake firehose.

**Session primer:**
> I'm learning frontend system design in isolated pieces. This session: **rendering performance under a high-frequency data firehose** in React. I have a table of ~500 stock rows getting hundreds of price updates per second. I want to learn: decoupling ingestion from rendering (buffer ticks, flush on requestAnimationFrame/interval), **coalescing** (keep only the latest price per symbol per frame), an **external store with fine-grained subscriptions** so only the changed row re-renders (useSyncExternalStore or Zustand), and **list virtualization**. Help me build a demo with a fake tick generator (no WebSocket) and measure re-renders with the React DevTools profiler. Teach the why behind each technique.

**Concepts to nail:**
- **Decouple ingestion from render:** never `setState` per tick. Buffer into a plain object/Map, flush on a timer or rAF.
- **Coalesce:** within a frame, only the latest price per symbol matters — drop the rest.
- **Fine-grained subscriptions:** `useSyncExternalStore` (learn the primitive first), then Zustand/Jotai as ergonomic wrappers. Only the AAPL row re-renders when AAPL moves.
- **Virtualization:** render only visible rows (`@tanstack/react-virtual` or hand-rolled).
- **Measuring:** React DevTools Profiler "highlight updates" — see exactly what re-renders.

**Build:** Fake tick generator (setInterval cranking out random updates for 500 symbols) → external store → virtualized table. Toggle each optimization on/off and watch the profiler.

**Done when:**
- [ ] Hundreds of updates/sec, table stays at ~60fps, and only changed rows flash in the profiler.
- [ ] You can demonstrate the *bad* version (setState per tick, whole table re-renders) and explain each fix.

**Connective tissue:** "Efficient high-frequency updates" + "smooth UI / scalable state" — done. This store is what Unit 4's fan-out feeds into.

**Go deeper (no rush):**
- **Move work off the main thread.** Do parsing/diffing in a Web Worker so the main thread only does layout/paint. Measure the difference under load.
- **Canvas rendering at extreme rates.** When even virtualized DOM can't keep up (think a full order book updating thousands of times/sec), render the hot region to `<canvas>` / OffscreenCanvas instead of DOM nodes. Build a canvas-rendered ticker and compare.
- **Empirical store shootout.** Implement the same table on `useSyncExternalStore`, Zustand, Jotai, and Valtio; profile render behavior on each. Form your own opinion rather than borrowing one.
- **Flush strategy tuning.** Compare rAF-flush vs fixed-interval flush vs "flush when buffer hits N." Note the latency/throughput tradeoffs — directly relevant to backpressure from Unit 3.

---

## Unit 6 — Security (a lens, not a build)

**Goal:** Walk back through Units 1, 3, 4 and harden them. Less new code, more "where are the holes."

**Session primer:**
> I'm learning frontend system design. This session is a **security review** of a stock trading frontend across subdomains with SSO and WebSockets. Walk me through: where tokens should live (httpOnly cookie vs memory vs localStorage) and the XSS vs CSRF tradeoffs; CSRF defenses (SameSite, double-submit, custom header); Content Security Policy; why WSS and how to authenticate a WebSocket; validating/escaping inbound WS messages; and admin-subdomain privilege separation. Quiz me and poke holes in a naive design.

**Concepts to nail:**
- **XSS vs CSRF**, and why your token-storage choice trades one risk for the other.
- **SameSite cookies**, double-submit tokens, custom headers as CSRF defenses.
- **CSP** to blunt XSS impact (which protects the httpOnly-cookie approach).
- **WSS** always; how a socket gets authenticated (cookie sent on handshake, or token in first message — and the pitfalls of putting tokens in the URL).
- **Privilege separation** for the `admin.` subdomain.

**Done when:**
- [ ] You can state, for *your* Unit 1 design, exactly which attack class you're exposed to and how you mitigate it.
- [ ] You can explain how the shared socket is authenticated and what happens to it on logout.

**Go deeper (no rush):**
- **Full threat model.** Write a STRIDE-style pass over the whole platform: spoofing, tampering, repudiation, info disclosure, denial of service, elevation of privilege. For a *trading* app, think hard about the admin subdomain and about an attacker placing trades.
- **Re-evaluate Unit 1 against the BFF pattern** specifically through the security lens — what XSS/CSRF surface disappears when the browser never holds a token?
- **WebSocket auth edge cases.** What happens to a live socket the instant a session is revoked server-side? (Should it be force-closed? On what signal?) Tie this to cross-tab logout from Unit 2.

---

## Synthesis session — solve the whole question

**Goal:** Answer the original interview question end to end, out loud, as if interviewing — then optionally stitch the demos into one app.

**Session primer:**
> I've built isolated demos for: SSO across subdomains, cross-tab coordination + leader election, robust WebSocket lifecycle, one shared socket across tabs, high-frequency render performance, and a security review. Now I want to **answer the full system design question** as in an interview: "Design a React frontend architecture for a stock trading platform across subdomains (trade, portfolio, analytics, admin) supporting SSO, real-time updates, shared cross-tab/subdomain sessions, secure token auto-refresh, cross-tab logout sync, minimal sockets, and smooth UI." Push me to present a clean architecture, justify tradeoffs, and connect the pieces — especially that coordination is one shared primitive and that token-refresh and socket-sharing are the same single-flight shape. Interview me; don't just give me the answer.

**Force yourself to articulate:**
- Auth & session: cookie on `.domain.com` for SSO; access+refresh with rotation; **single-flight refresh via Web Locks**.
- Cross-tab logout: broadcast logout; leader clears socket; cookie cleared server-side; followers react. (And how to span *subdomains*, not just tabs.)
- One socket: leader/SharedWorker owns it; fan-out; handoff on close.
- Reconnect: backoff + jitter + resubscribe.
- Performance: buffer → coalesce → external store w/ fine-grained subscriptions → virtualization.
- Security: token storage tradeoff, CSRF/XSS/CSP, WSS, admin separation.

---

## Pacing — depth over speed

No schedule. Since you're not time-boxed, the better optimization is *depth*, not throughput. Two guidelines:

- **One unit at a time, fully.** Hit the "Done when" checklist, then decide in the moment whether to drill into "Go deeper" now or circle back later. Resist starting a new unit while one is half-understood.
- **Let units settle.** After a meaty unit (especially 2, 3, 4), take a gap before the next. The composition insights tend to click during the gap, not during the build.

A rough sense of weight, if it helps you plan: Units 2 and 3 are the deep ones and reward the most time; Unit 4 is mostly assembly once 2 and 3 are solid; Unit 1 is broad; Unit 5 is its own world; Unit 6 is reflective. Spend accordingly, not evenly.

The only hard rules remain: **2 and 3 before 4**, and **6 late**.

---

## Self-check before the synthesis

You're ready when you can answer these without notes:
1. Which cookie attribute gives you SSO across subdomains, and why doesn't a localStorage token?
2. Why do three tabs hitting an expired token need *one* refresh, and what mechanism enforces that?
3. Why is "cross-tab" easier than "cross-subdomain," and how do you bridge the gap?
4. Why must you resubscribe after a WebSocket reconnect, and why add jitter to backoff?
5. How do you keep a 500-row table at 60fps under hundreds of updates/sec — name the four techniques?
6. What's the XSS/CSRF tradeoff in your token-storage choice?

If a question stumps you, that's the unit to revisit.
