import { useSyncExternalStore, useCallback } from "react";
import { subscribe, getPrice } from "./price-store";

export const usePrice = (symbol: string) => {
  const subscribeToSymbol = useCallback(
    (callback: () => void) => {
      return subscribe(symbol, callback);
    },
    [symbol],
  );

  const getSnapshot = useCallback(() => {
    return getPrice(symbol);
  }, [symbol]);

  return useSyncExternalStore(subscribeToSymbol, getSnapshot);
};
