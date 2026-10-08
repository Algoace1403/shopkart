// Same-origin API calls keep secure login cookies working on Vercel.
const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5001');

// Share JSON handling and cookies across pages. options supplies method, body or abort signal.
export async function api(path, options = {}) {
  const response = await fetch(API_URL + path, {
    ...options,
    // Include cookies even though the frontend and backend run on different ports.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  // Convert the JSON response into a JavaScript object.
  const data = await response.json();
  // Throw API failures so pages can display messages or redirect on 401.
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}
