import { useEffect, useState } from "react";

const TOKEN_KEY = "refresh-token";

const fetchToken = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Date().getTime());
    }, 1000 * 10);
  });
};

const getToken = async () => {
  let token = "";

  console.log("Requesting lock");
  await navigator.locks.request("token-refresh", async () => {
    console.log("Inside lock");
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      console.log("Using stored value");
      token = stored;
    } else {
      console.log("Fetching new token");
      token = (await fetchToken()) as string;
      localStorage.setItem(TOKEN_KEY, token);
    }
  });
  console.log("Lock finished");

  return token;
};

export function SingleFlightTokenDemo() {
  const [token, setToken] = useState("");

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  return (
    <div>
      <h1>Single Flight token Demo</h1>
      <div>Token: {token}</div>
    </div>
  );
}
