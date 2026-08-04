export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("jwt_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("Token expired or invalid. Logging out...");

    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_info");

    window.location.href = "/"; 
    
    return response; 
  }

  return response;
};