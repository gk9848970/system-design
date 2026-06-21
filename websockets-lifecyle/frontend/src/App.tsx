import { useStockSocket, type Quote } from "./use-stock-socket";

function App() {
  const { quotes, status, subscribe, unsubscribe } = useStockSocket(
    "ws://localhost:8080",
  );

  return (
    <div>
      <div>
        <div>status: {status}</div>
        {Object.values(quotes).map((quote: Quote | null) => {
          if (!quote) return;

          return (
            <div key={quote.symbol}>
              {quote ? `${quote.symbol} ${quote.price}` : "no quote yet"}
            </div>
          );
        })}
      </div>
      <div>
        <div>
          AAPL:
          <button onClick={() => subscribe("AAPL")}>Subscribe</button>{" "}
          <button onClick={() => unsubscribe("AAPL")}>Unsubscribe</button>
        </div>
        <div>
          TSLA:
          <button onClick={() => subscribe("TSLA")}>Subscribe</button>{" "}
          <button onClick={() => unsubscribe("TSLA")}>Unsubscribe</button>
        </div>
        <div>
          BTC:
          <button onClick={() => subscribe("BTC")}>Subscribe</button>{" "}
          <button onClick={() => unsubscribe("BTC")}>Unsubscribe</button>
        </div>
      </div>
    </div>
  );
}

export default App;
