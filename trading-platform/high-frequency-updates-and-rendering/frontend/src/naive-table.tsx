import { useEffect, useState } from "react";
import { startTickGenerator, SYMBOLS } from "./tick-generator";
import { Row } from "./row";

const initialPrices: Record<string, number> = Object.fromEntries(
  SYMBOLS.map((s) => [s, 0]),
);

export const NaiveTable = () => {
  const [prices, setPrices] = useState(initialPrices);

  useEffect(() => {
    let buffer: Record<string, number> = {};

    const stop = startTickGenerator((tick) => {
      buffer[tick.symbol] = tick.price;
    });

    const flushId = setInterval(() => {
      const next = buffer;
      buffer = {};
      setPrices((prev) => ({ ...prev, ...next }));
    }, 16);

    return () => {
      stop();
      clearInterval(flushId);
    };
  }, []);

  return (
    <div>
      {SYMBOLS.map((s) => (
        <Row key={s} symbol={s} price={prices[s]} />
      ))}
    </div>
  );
};
