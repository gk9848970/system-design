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

  ws.on("close", () => {
    console.log("[server] client disconnected");
    // TODO 3: stop the interval here.
    //   Before you write it — reason about why: if you DON'T clear it, what
    //   keeps happening after the client is gone, and what does ws.send() do
    //   on a closed socket? What breaks first — loudly, or silently?
    //
    clearInterval(intervalId);
  });

  ws.on("error", (err) => console.log("[server] ws error", err.message));
});
