import { useCallback, useEffect, useRef, useState } from "react";

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
  }, []);

  const unsubscribe = useCallback((sym: string) => {
    subscriptionsRef.current.delete(sym);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = { symbol: sym, type: "unsubscribe" };
      ws.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!isLeader) return;
    console.log(tabId, "Running the WebSocket connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");

      const symbols = subscriptionsRef.current;
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
