import { useCallback, useEffect, useRef, useState } from "react";
import { readUnion, writeUnion } from "./union";

export function useStockSocket(
  url: string,
  isLeader: boolean,
  tabId: string,
  postTick: (symbol: string, price: number, leaderTabId: string) => void,
) {
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const subscribe = useCallback((sym: string) => {
    subscriptionsRef.current.add(sym);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = { symbol: sym, type: "subscribe" };
      ws.send(JSON.stringify(payload));
    }

    writeUnion(subscriptionsRef.current);
  }, []);

  const unsubscribe = useCallback((sym: string) => {
    subscriptionsRef.current.delete(sym);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = { symbol: sym, type: "unsubscribe" };
      ws.send(JSON.stringify(payload));
    }

    writeUnion(subscriptionsRef.current);
  }, []);

  useEffect(() => {
    if (!isLeader) return;
    console.log(tabId, "Running the WebSocket connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");

      const symbols = readUnion();
      console.log(symbols);
      for (const sym of symbols) {
        ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      }
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "tick") {
        postTick(msg.symbol, msg.price, tabId);
      }
    };

    ws.onclose = () => setStatus("closed");

    return () => {
      ws.close();
    };
  }, [url, isLeader, tabId, postTick]);

  return { status, subscribe, unsubscribe };
}
