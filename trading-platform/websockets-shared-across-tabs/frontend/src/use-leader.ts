import { useEffect, useState } from "react";

// Tag every log with a short per-tab id so multi-tab logs are readable.
const TAB_ID = crypto.randomUUID().slice(0, 4);
const LOCK_NAME = "socket-leader";

export function useLeader() {
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    let resolve = null;

    navigator.locks.request(LOCK_NAME, () => {
      return new Promise((res) => {
        resolve = res;
        setIsLeader(true);
      });
    });

    return () => {
      resolve?.();
    };
  }, []);

  return { isLeader, tabId: TAB_ID };
}
