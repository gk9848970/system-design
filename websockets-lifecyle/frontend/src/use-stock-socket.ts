import { useEffect, useRef, useState } from "react";

type Quote = { symbol: string; price: number; time: number };

const BASE_DELAY = 1000 * 1;
const MAX_DELAY = 1000 * 60;

export function useStockSocket(url: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );
  const socketRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    let closedByUs = false;

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
        attemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        setQuote(JSON.parse(event.data));
      };

      socket.onerror = (err) => console.log("ws error", err);

      socket.onclose = (event) => {
        console.log("close", event.code, event.wasClean);
        setStatus("closed");

        if (!closedByUs) scheduleReconnect();
      };
    }

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimerRef.current);
      socketRef.current?.close();
    };
  }, [url]);

  return { quote, status };
}
