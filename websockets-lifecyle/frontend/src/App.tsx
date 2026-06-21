import { useStockSocket } from "./use-stock-socket";

function App() {
  const { quote, status } = useStockSocket("ws://localhost:8080");

  return (
    <div>
      <div>status: {status}</div>
      <div>{quote ? `${quote.symbol} ${quote.price}` : "no quote yet"}</div>
    </div>
  );
}

export default App;
