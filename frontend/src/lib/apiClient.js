// API helper to consistently include Authorization header
import { getToken } from "./authService";

const API_BASE = "http://localhost:4000";

function getHeaders(includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function apiFetch(endpoint, options = {}) {
  const { method = "GET", body = null, includeAuth = true, ...rest } = options;

  const fetchOptions = {
    method,
    headers: getHeaders(includeAuth),
    ...rest,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
  return response;
}

export default { apiFetch, getHeaders };
