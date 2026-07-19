# Checkpoints

## High-Frequency Updates & Rendering Performance

### Fake tick generator

1. setInterval random-walks a Map, emits {symbol, price} ~250/sec — confirmed rate in console
2. Naive setState-per-tick
3. setState every tick → "highlight updates" whole table orange
4. Flamegraph: ~200 commits/sec, ~8.3ms JS/frame → paint starved, frames drop

### Buffer + flush

1. Ticks into let buffer in []-effect; flush on interval, not per tick
2. setState(...); buffer={} → updater read emptied buffer; fixed with snapshot-before-reset
3. Flush 1000ms: one 60ms commit/sec, stuck-then-snap lurch
4. Flush 16ms: smooth 60fps, ~3.4ms commits, but whole table yellow-orange

### Fine-grained subscriptions (useSyncExternalStore)

1. External store: prices Map + per-symbol listener Sets; applyUpdates notifies only that symbol
Per-symbol Sets over one global list (global re-notifies all 500)
2. usePrice wraps subscribe/getPrice with useCallback; getSnapshot returns primitive
3. Row self-subscribes, StoreTable stateless → parent stops re-rendering
4. Profiler: only changed rows flash, blue, 0.2ms

### Virtualization

1. 20k rows: updates stay cheap but DevTools + mount lag — existence cost
2. Spacer div + absolute slice from scrollTop; floor startIndex, clamp endIndex to length
3. Bottom row drifts-then-pops on slow scroll-up → added overscan, dialed to minimum
4. ~40 DOM nodes constant at any N; DevTools + mount snappy
