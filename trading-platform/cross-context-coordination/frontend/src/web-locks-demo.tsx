import { useEffect, useRef, useState } from "react";

function useLeader() {
  const [isLeader, setIsLeader] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // In strict mode, We will request two locks
    navigator.locks.request("leader-lock", () => {
      setIsLeader(true);
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
    });

    return () => {
      resolveRef.current?.();
    };
  }, []);

  function resolveLock() {
    resolveRef.current?.();
    setIsLeader(false);
  }

  return { isLeader, resolveLock };
}

export function WebLocksDemo() {
  const { isLeader, resolveLock } = useLeader();

  return (
    <div>
      <h1>I am a {isLeader ? "Leader" : "Follower"}</h1>
      {isLeader ? (
        <button onClick={resolveLock}>Give up leadership</button>
      ) : null}
    </div>
  );
}
