const API_URL = "http://api.lvh.me:4000";

export const apiFetch = async (route: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${route}`, {
    credentials: "include",
    ...options,
  });

  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      const newResponse = await fetch(`${API_URL}${route}`, {
        credentials: "include",
        ...options,
      });

      return newResponse;
    }
  }

  return response;
};
