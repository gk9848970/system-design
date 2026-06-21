import { useEffect, useRef, useState } from "react";

export type Quote = { symbol: string; price: number; time: number };

const BASE_DELAY = 1000 * 1;
const MAX_DELAY = 1000 * 60;
const PING_INTERVAL = 1000 * 5;
const PONG_TIMEOUT = 1000 * 3;

export function useStockSocket(url: string) {
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [status, setStatus] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );
  const socketRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const retryTimerRef = useRef(null);

  const pingTimerRef = useRef(null);
  const pongTimerRef = useRef(null);

  const subscriptionsRef = useRef<Set<string>>(new Set());

  function subscribe(symbol: string) {
    subscriptionsRef.current.add(symbol);
    const currSocket = socketRef.current;
    if (currSocket && currSocket.readyState === WebSocket.OPEN) {
      const payload = { symbol, type: "subscribe" };
      currSocket.send(JSON.stringify(payload));
    }
  }

  function unsubscribe(symbol: string) {
    subscriptionsRef.current.delete(symbol);
    const currSocket = socketRef.current;
    if (currSocket && currSocket.readyState === WebSocket.OPEN) {
      const payload = { symbol, type: "unsubscribe" };
      currSocket.send(JSON.stringify(payload));
    }

    setQuotes((prev) => ({ ...prev, [symbol]: null }));
  }

  useEffect(() => {
    let closedByUs = false;

    function startHeartbeat() {
      pingTimerRef.current = setInterval(() => {
        socketRef.current?.send(
          JSON.stringify({
            type: "ping",
          }),
        );

        pongTimerRef.current = setTimeout(() => {
          socketRef.current?.close();
        }, PONG_TIMEOUT);
      }, PING_INTERVAL);
    }

    function stopHeartbeat() {
      clearInterval(pingTimerRef.current);
      clearTimeout(pongTimerRef.current);
    }

    function scheduleReconnect() {
      // Random number between 1 - 10 -> Math.floor(Math.random() * 10) + 1
      const rawDuration = BASE_DELAY * 2 ** attemptsRef.current;
      const cappedDuration = Math.min(rawDuration, MAX_DELAY);
      const finalDuration = Math.random() * cappedDuration;
      retryTimerRef.current = setTimeout(() => connect(), finalDuration);

      console.log(
        `reconnect in ${Math.round(finalDuration)}ms (attempt ${attemptsRef.current})`,
      );

      attemptsRef.current += 1;
    }

    function connect() {
      setStatus("connecting");
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("open");
        startHeartbeat();
        subscriptionsRef.current.forEach((symbol) => {
          socket.send(JSON.stringify({ type: "subscribe", symbol }));
        });
      };

      socket.onmessage = (event) => {
        attemptsRef.current = 0;
        clearTimeout(pongTimerRef.current);

        const parsedMsg = JSON.parse(event.data);
        if (parsedMsg.type === "pong") return;
        setQuotes((prev) => ({ ...prev, [parsedMsg.symbol]: parsedMsg }));
      };

      socket.onerror = (err) => console.log("ws error", err);

      socket.onclose = (event) => {
        console.log("close", event.code, event.wasClean);
        setStatus("closed");
        stopHeartbeat();

        if (!closedByUs) scheduleReconnect();
      };
    }

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimerRef.current);
      socketRef.current?.close();
      stopHeartbeat();
    };
  }, [url]);

  return { quotes, status, subscribe, unsubscribe };
}
