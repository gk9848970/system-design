import { WebSocketServer } from "ws";

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

  let price = 100;

  const intervalId = setInterval(() => {
    if (paused) return;
    const step = (Math.random() - 0.5) * 1;
    const time = Date.now();

    const data = {
      symbol: "AAPL",
      price,
      time,
    };

    price += step;

    ws.send(JSON.stringify(data));
  }, 500);

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "ping") {
      if (paused) return;
      ws.send(JSON.stringify({ type: "pong" }));
    }
  });

  ws.on("close", () => {
    console.log("[server] client disconnected");
    clearInterval(intervalId);
  });

  ws.on("error", (err) => console.log("[server] ws error", err.message));
});
