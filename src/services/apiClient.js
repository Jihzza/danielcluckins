// Simple helper to call Netlify functions with JSON payloads

export async function callFunction(functionName, payload) {
  const base = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '/.netlify/functions';
  const url = `${base.replace(/\/$/, '')}/${functionName}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMessage = (isJson && data && data.error) ? data.error : (typeof data === 'string' ? data : 'Request failed');
    throw new Error(errorMessage);
  }

  return data;
}

// src/services/apiClient.js
import axios from 'axios';

/**
 * Create a dedicated, configured Axios instance.
 *
 * Why do this?
 * - Centralized Configuration: Set the base URL for your API in one spot.
 * If your API domain changes, you only have to update it here.
 * - Easy Authentication: When you implement user authentication, you can add
 * interceptors here to automatically attach auth tokens to every request.
 * - Consistent Headers: Set default headers (like Content-Type) for all requests.
 */
const apiClient = axios.create({
  // --- IMPORTANT ---
  // Replace this with the actual base URL of your backend API.
  baseURL: 'http://localhost:3001/api', // Example: 'https://yourapi.com/api'
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;