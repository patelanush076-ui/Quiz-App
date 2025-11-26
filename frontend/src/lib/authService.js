// Simple auth service using backend endpoints and localStorage
import { validateUsername, validatePassword } from "./validation.js";

const KEY_TOKEN = "jwt";
const KEY_USER = "user";
const API_BASE = import.meta.env.VITE_API_URL;

export async function signup(name, password) {
  // Validate input
  const nameErrors = validateUsername(name);
  const passwordErrors = validatePassword(password);

  if (nameErrors.length > 0) {
    throw new Error(nameErrors[0]);
  }

  if (passwordErrors.length > 0) {
    throw new Error(passwordErrors[0]);
  }

  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Signup failed");
  if (json.token) {
    localStorage.setItem(KEY_TOKEN, json.token);
  }
  if (json.user) {
    localStorage.setItem(KEY_USER, JSON.stringify(json.user));
  }
  return json;
}

export async function login(name, password) {
  // Validate input
  const nameErrors = validateUsername(name);

  if (nameErrors.length > 0) {
    throw new Error(nameErrors[0]);
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Login failed");
  if (json.token) localStorage.setItem(KEY_TOKEN, json.token);
  if (json.user) localStorage.setItem(KEY_USER, JSON.stringify(json.user));
  return json;
}

export async function logout() {
  // Clear local storage first
  const token = localStorage.getItem(KEY_TOKEN);
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);

  // Call backend logout if token exists
  if (token) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn("Failed to logout on server:", e);
      // Continue anyway since local storage is already cleared
    }
  }
}

export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export default { signup, login, logout, getToken, getUser };
