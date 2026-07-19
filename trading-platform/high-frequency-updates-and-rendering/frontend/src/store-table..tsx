import { useEffect } from "react";
import { startTickGenerator, SYMBOLS } from "./tick-generator";
import { StoreRow } from "./store-row";
import { applyUpdates } from "./price-store";

export const StoreTable = () => {
  useEffect(() => {
    let buffer: Record<string, number> = {};

    const stop = startTickGenerator((tick) => {
      buffer[tick.symbol] = tick.price;
    });

    const flushId = setInterval(() => {
      const next = buffer;
      buffer = {};
      applyUpdates(next);
    }, 16);

    return () => {
      stop();
      clearInterval(flushId);
    };
  }, []);

  return (
    <div>
      {SYMBOLS.map((s) => (
        <StoreRow key={s} symbol={s} />
      ))}
    </div>
  );
};
