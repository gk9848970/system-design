// src/useTickChannel.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ticks } from "./App";
const CHANNEL = "ticks";

// Leader calls postTick to fan a tick out to followers.
// Every tab (leader + followers) listens and renders from what it hears.
export function useTickChannel(tabId: string) {
  const [ticks, setTicks] = useState<Ticks>({});
  const chanRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const chan = new BroadcastChannel(CHANNEL);
    chanRef.current = chan;

    chan.onmessage = (e) => {
      const { data } = e;
      console.log("Tick coming to TabID", tabId, data);
      setTicks((prev) => ({ ...prev, [data.symbol]: data.price }));
    };

    return () => chan.close();
  }, [tabId, setTicks]);

  const postTick = useCallback(function postTick(
    symbol: string,
    price: number,
    leaderTabID: string,
  ) {
    console.log("Posting the tick from leader tab with ID", leaderTabID);
    chanRef.current?.postMessage({ symbol, price });

    // Leader needs to update it's own ticks, It can't broadcast event to itself
    setTicks((prev) => ({ ...prev, [symbol]: price }));
  }, []);

  return { ticks, postTick };
}
