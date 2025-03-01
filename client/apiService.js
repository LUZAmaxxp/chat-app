// apiService.js
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }
  return response.json();
}

export { fetchWithAuth };
