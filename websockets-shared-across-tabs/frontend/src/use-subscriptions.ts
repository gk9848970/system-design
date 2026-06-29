import { useCallback, useEffect, useRef, useState } from "react";

const SUB_CHANNEL = "subs";

export const useSubscriptions = (
  isLeader: boolean,
  subscribe: (sym: string) => void,
  unsubscribe: (sym: string) => void,
) => {
  const chanRef = useRef<BroadcastChannel | null>(null);
  const [mySubscriptions, setMySubscriptions] = useState<string[]>([]);

  const requestSubscription = useCallback(
    (type: string, symbol: string) => {
      if (type === "subscribe") {
        setMySubscriptions((prev) =>
          prev.includes(symbol) ? prev : [...prev, symbol],
        );
      } else if (type === "unsubscribe") {
        setMySubscriptions((prev) => prev.filter((p) => p !== symbol));
      }

      if (isLeader) {
        if (type === "subscribe") {
          subscribe(symbol);
        } else if (type === "unsubscribe") {
          unsubscribe(symbol);
        }
      } else {
        const channel = chanRef.current;
        if (!channel) return;
        channel.postMessage({ type, symbol });
      }
    },
    [isLeader, subscribe, unsubscribe],
  );

  useEffect(() => {
    const chan = new BroadcastChannel(SUB_CHANNEL);
    chanRef.current = chan;

    chan.onmessage = (e) => {
      console.log("Msg for subscription received", isLeader);
      if (!isLeader) return;
      console.log("Acting as leader on the message received for subscription");
      const { data } = e;
      if (data.type === "subscribe") {
        subscribe(data.symbol);
      } else if (data.type === "unsubscribe") {
        unsubscribe(data.symbol);
      }
    };

    return () => {
      chan.close();
    };
  }, [isLeader, subscribe, unsubscribe]);

  return { requestSubscription, mySubscriptions };
};
