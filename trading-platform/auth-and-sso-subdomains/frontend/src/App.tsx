type User = { email: string };

import { useEffect, useState } from "react";
import { apiFetch } from "./api-fetch";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const host = window.location.hostname;

  async function checkMe() {
    try {
      const response = await apiFetch("/me");
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

  async function login() {
    const response = await apiFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const data = await response.json();
    setUser(data.user);
  }

  async function logout() {
    const response = await apiFetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
