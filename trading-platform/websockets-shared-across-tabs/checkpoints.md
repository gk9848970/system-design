# Checkpoints

## One Shared WebSocket Across Tabs

### Leader election (Web Locks)

1. Naive client opens a socket per tab → 4 tabs = 4 sockets in Network→WS, server logs "connected" 4× — the wall
2. 4 tabs → one LEADER; kill it → a survivor flips (watch Application→Web Locks)

### Gate socket on leadership

1. Socket in leader-only effect → Network→WS shows 1 socket, server logs "connected" once
2. New wall: followers' ticks empty — data lives only in leader's tab

### Tick fan-out (BroadcastChannel)

1. Leader posts each tick on "ticks" channel; all tabs listen + render
2. No self-echo → leader posts and locally setTicks
3. Verify: 4 tabs, 1 socket, all four render

### Subscription fan-in (union)

1. Followers announce wants to leader over "subs" channel; leader folds into union, subscribes union on the one socket
2. Split: socket subscribes the union; each tab renders only its own wants
3. requestSubscription: leader folds directly, follower posts to channel
4. Per-tab mySubscriptions drives render, union never rendered
5. Union is a ref (live, read in onopen replay); state mirror only for re-render

### Handoff replay (union survives death)

1. Wall: union only in leader's ref → kill leader → new ref empty → zero subscribes → all ticks freeze
2. One shared store (localStorage), leader sole writer (no clobber) — rejected N per-tab copies
3. Persist in subscribe/unsubscribe; new leader readUnion() in onopen before replay (only moment with current union + open socket)
4. Verify: kill leader → both symbols resume; <1s gap remains (intrinsic to arch-a; SharedWorker has none)
