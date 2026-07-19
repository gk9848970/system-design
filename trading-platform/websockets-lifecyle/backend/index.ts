import { WebSocketServer } from "ws";

const PRICES = { AAPL: 100, TSLA: 200, BTC: 50000 };

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

console.log("Server running on port", PORT);

import readline from "readline";

let paused = false;
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  if (key.name === "p") {
    paused = !paused;
    console.log(
      paused ? "[server] PAUSED (still connected)" : "[server] resumed",
    );
  }
  if (key.ctrl && key.name === "c") process.exit();
});

wss.on("connection", (ws) => {
  console.log("[server] client connected");
  const subscriptions = new Set(); // per-socket cache — dies with this socket

  const intervalId = setInterval(() => {
    if (paused) return;

    subscriptions.forEach((value) => {
      const step = (Math.random() - 0.5) * 1;
      const time = Date.now();

      const data = {
        symbol: value,
        price: PRICES[value as keyof typeof PRICES],
        time,
      };

      PRICES[value as keyof typeof PRICES] += step;
      ws.send(JSON.stringify(data));
    });
  }, 500);

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "ping") {
      if (!paused) {
        ws.send(JSON.stringify({ type: "pong" }));
      }
      return;
    } else if (msg.type === "subscribe") {
      console.log("subscribtion added for ", msg.symbol);
      subscriptions.add(msg.symbol);
    } else if (msg.type === "unsubscribe") {
      subscriptions.delete(msg.symbol);
      console.log("subscribtion removed for ", msg.symbol);
    }
  });

  ws.on("close", () => {
    console.log("[server] client disconnected");
    clearInterval(intervalId);
  });

  ws.on("error", (err) => console.log("[server] ws error", err.message));
});
