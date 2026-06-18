# Checkpoints

## Cross context coordination

### Broadcast channel

1. new BroadcastChannel(name) in each tab → postMessage broadcasts to all OTHER same-origin tabs (not sender)
2. Synced a shared array across tabs by broadcasting each change
3. KEY BOUNDARY: same-ORIGIN only. trade.lvh.me → portfolio.lvh.me did NOT cross.
   (Cookie crosses subdomains = site-scoped; BroadcastChannel doesn't = origin-scoped.)

### Leader election (Web Locks)

1. navigator.locks.request + never-resolving promise = hold leadership for tab's lifetime.
2. Browser auto-releases on close/crash → next queued tab leads. Resolve the promise = voluntary handoff.
3. (StrictMode double-invokes the effect → two requests from one tab; needs per-run cleanup or StrictMode off.)

## Single-flight across tabs
1. Lock ("token-refresh") + localStorage. Inside lock: if stored→use, else fetch+store.
2. N tabs concurrent → exactly ONE fetches, rest read stored. This is refresh-stampede for same origin.
