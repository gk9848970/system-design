type User = { email: string };

import { useEffect, useState } from "react";

const TIMER_DURATION = 1000 * 60 * 3.5; // 3.5 mins

const API_URL = "http://api.lvh.me:4000";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const host = window.location.hostname;

  async function checkMe() {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkMe();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`${API_URL}/refresh`, {
        method: "POST",
        credentials: "include",
      });
    }, TIMER_DURATION);

    return () => clearInterval(intervalId);
  }, []);

  async function login() {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
      credentials: "include",
    });

    const data = await response.json();
    setUser(data.user);
  }

  async function logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (response.ok) {
      setUser(null);
    }
  }

  return (
    <>
      <div style={{ fontFamily: "system-ui", padding: 40 }}>
        <h1>{host}</h1>
        {user ? (
          <div>
            <p>Logged in as {user.email}</p>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <button onClick={login}>Login</button>
        )}
      </div>
    </>
  );
}

export default App;
