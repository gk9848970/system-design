import { useEffect, useRef, useState } from "react";
import { startTickGenerator, SYMBOLS } from "./tick-generator";
import { StoreRow } from "./store-row";
import { applyUpdates } from "./price-store";

export const ROW_HEIGHT = 32;
const CONTAINER_HEIGHT = 600;
const OVERSCAN = 30;

export const VirtualisedTable = () => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const totalHeight = SYMBOLS.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    SYMBOLS.length,
    startIndex + Math.ceil(CONTAINER_HEIGHT / ROW_HEIGHT) + OVERSCAN,
  );
  const visible: string[] = SYMBOLS.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{
        height: CONTAINER_HEIGHT,
        overflow: "auto",
        position: "relative",
        border: "1px solid blue",
      }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visible.map((s, i) => {
          const actualIndex = startIndex + i;
          return (
            <div
              key={s}
              style={{
                position: "absolute",
                width: "100%",
                top: actualIndex * ROW_HEIGHT,
                height: ROW_HEIGHT,
              }}
            >
              <StoreRow symbol={s} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
