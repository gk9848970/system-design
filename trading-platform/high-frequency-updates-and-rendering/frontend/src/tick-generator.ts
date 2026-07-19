import type { Tick } from "./types";

export const SYMBOLS: string[] = Array.from(
  { length: 50000 },
  (_, i) => `SYM${i.toString().padStart(5, "0")}`,
);

const prices = new Map<string, number>(
  SYMBOLS.map((s) => [s, 50 + Math.random() * 450]),
);

// Fires ONE tick per timer fire (not a batch) — this detail matters later;
// you'll see why in the profiler. ~4ms ≈ 250 ticks/sec.
export function startTickGenerator(
  onTick: (tick: Tick) => void,
  intervalMs = 4,
): () => void {
  const id = setInterval(() => {
    const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const current = prices.get(randomSymbol)!;
    const finalPrice = current + (Math.random() - 0.5) * 2;
    prices.set(randomSymbol, finalPrice);
    onTick({ symbol: randomSymbol, price: finalPrice });
  }, intervalMs);

  return () => clearInterval(id);
}
