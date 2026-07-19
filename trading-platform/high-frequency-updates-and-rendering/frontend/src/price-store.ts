import { SYMBOLS } from "./tick-generator";

// The durable truth — a plain Map, lives outside React.
const prices = new Map<string, number>(SYMBOLS.map((s) => [s, 0]));

// Per-symbol subscriber sets: symbol -> set of callbacks to notify.
// (A row subscribes to ONE symbol, so we notify only that symbol's listeners.)
const listeners = new Map<string, Set<() => void>>();

// Called by the flush to write a batch of new prices into the store.
export function applyUpdates(updates: Record<string, number>) {
  for (const symbol in updates) {
    const newPrice = updates[symbol];
    prices.set(symbol, newPrice);
    listeners.get(symbol)?.forEach((callback) => callback());
  }
}

// Subscribe a callback to a single symbol. Returns an unsubscribe fn.
export function subscribe(symbol: string, callback: () => void): () => void {
  const set = listeners.get(symbol) || new Set();

  set.add(callback);
  listeners.set(symbol, set);

  return () => {
    set.delete(callback);
  };
}

// Read the current price for one symbol (getSnapshot uses this).
export function getPrice(symbol: string): number {
  return prices.get(symbol) ?? 0;
}
