// One shared, tab-death-surviving source of truth for the union.
// Convention: the LEADER is the sole writer. Any tab may read.
const WEBSOCKET_SUBSCRIPTION_KEY = "websocket-subscription-union";

export function readUnion(): Set<string> {
  const current = localStorage.getItem(WEBSOCKET_SUBSCRIPTION_KEY);

  if (current) {
    const array = JSON.parse(current) as string[];
    return new Set(array);
  }

  return new Set();
}

export function writeUnion(union: Set<string>): void {
  const value = JSON.stringify([...union]);
  localStorage.setItem(WEBSOCKET_SUBSCRIPTION_KEY, value);
}
