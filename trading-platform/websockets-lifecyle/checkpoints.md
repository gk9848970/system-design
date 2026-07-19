# Checkpoints

## WebSocket Lifecycle

### Mock server + dumb hook
1. Build Node ws server: random-walk one price, send every 500ms on connect, clearInterval on close
2. Build useStockSocket: open socket in effect, onmessage → JSON.parse → setQuote; close + null ref on cleanup

### Loud death → reconnect

1. Kill server, watch screen freeze + onclose fire (1006, not onerror); confirm restart does nothing
3. Wrap connect in a connect() fn, call it from onclose to rebuild a new socket
3. Add closedByUs flag (set in cleanup) so own-unmount doesn't trigger reconnec

### Backoff + jitter

1. Replace instant retry: schedule connect() via setTimeout after a computed delay
Delay = BASE * 2**attempts, cap at MAX, then * Math.random() (full jitter); store timer in ref, clear on teardown
2. Increment attempts per retry; reset to 0 on success — confirm logs show doubling-with-scatter

### Half-open → heartbeat

1. Add pause toggle to server (freeze prices and pongs); confirm pausing freezes screen with zero client events
2. Server: on {type:"ping"} reply {type:"pong"} (skip while paused)
3. Client startHeartbeat: ping every 5s + and arm 3s watchdog setTimeout; reset watchdog on any message, fire → socket.close()
3. Call stopHeartbeat() in onclose; move attempts=0 reset from onopen to onmessage

### Resubscription

1. Subscribe only on user action (not on open) → kill + reconnect → watch symbols go silently dead (new socket = blank, status still open)
2. Client holds durable intent in subscriptionsRef Set; server's per-socket sub-set is a disposable cache that dies with the socket
3. Fix: onopen replays the whole subscriptionsRef set onto the fresh socket — one path for first-connect & reconnect ("on open, assert what I want")
4. Verify: server re-logs every sub on reconnect

### Multi-symbol

1. Server: module-level PRICES map (shared truth) + per-socket subscriptions Set; send only subscribed symbols
2. Client: quotes becomes a symbol → quote map, onmessage merges functionally ({...prev, [symbol]: msg})
3. Lifted subscribe/unsubscribe read the socket from ref at call-time (never capture an instance)
4. Verify: subscribe two, unsub one, kill + reconnect → only the remaining two replay
