import { useLeader } from "./use-leader";
import { useStockSocket } from "./use-stock-socket";
import { useSubscriptions } from "./use-subscriptions";
import { useTickChannel } from "./use-tick-channel";

export type Ticks = Record<string, number>;

export default function App() {
  const { isLeader, tabId } = useLeader();
  const { ticks, postTick } = useTickChannel(tabId);

  const { status, subscribe, unsubscribe } = useStockSocket(
    "ws://localhost:8080",
    isLeader,
    tabId,
    postTick,
  );

  const { requestSubscription, mySubscriptions } = useSubscriptions(
    isLeader,
    subscribe,
    unsubscribe,
  );

  return (
    <div style={{ fontFamily: "monospace", padding: 24 }}>
      <div>socket: {status}</div>
      <hr />
      {mySubscriptions.map((sym) => (
        <div key={sym}>
          {sym}: {ticks[sym]?.toFixed(2) ?? "—"}
        </div>
      ))}
      <div>
        tab {tabId}: {isLeader ? "LEADER" : "follower"}
      </div>
      <div>
        <span>AAPL</span>
        <button
          onClick={() => {
            requestSubscription("subscribe", "AAPL");
          }}
        >
          Subscribe
        </button>
        <button
          onClick={() => {
            requestSubscription("unsubscribe", "AAPL");
          }}
        >
          Unsubscribe
        </button>
      </div>
      <div>
        <span>TESLA</span>
        <button
          onClick={() => {
            requestSubscription("subscribe", "TESLA");
          }}
        >
          Subscribe
        </button>
        <button
          onClick={() => {
            requestSubscription("unsubscribe", "TESLA");
          }}
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
}
