import { WebSocketServer, WebSocket } from "ws";

declare module "ws" {
  interface WebSocket {
    subs: Set<string>;
  }
}

const wss = new WebSocketServer({ port: 8080 });
console.log("mock WS server on ws://localhost:8080");

// random-walk price state, shared across all connections
const prices = new Map<string, number>();

function nextPrice(sym: string): number {
  const cur = prices.get(sym) ?? 100;
  const next = cur + (Math.random() - 0.5) * 10; // drift
  prices.set(sym, next);
  return Number(next.toFixed(2));
}

wss.on("connection", (ws) => {
  console.log("client connected");

  // per-connection subscription set — hung on the ws instance (ws-idiomatic)
  ws.subs = new Set<string>();

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    // { type: "subscribe", symbol } / { type: "unsubscribe", symbol }
    if (msg.type === "subscribe") ws.subs.add(msg.symbol);
    if (msg.type === "unsubscribe") ws.subs.delete(msg.symbol);
  });

  ws.on("close", () => console.log("client disconnected"));
});

// one global timer: every 500ms push a tick to each connection
// for every symbol THAT connection is subscribed to
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState !== WebSocket.OPEN) continue;
    for (const sym of ws.subs) {
      ws.send(
        JSON.stringify({ type: "tick", symbol: sym, price: nextPrice(sym) }),
      );
    }
  }
}, 500);
