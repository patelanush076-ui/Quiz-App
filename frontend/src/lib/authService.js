// Simple auth service using backend endpoints and localStorage

const KEY_TOKEN = "jwt";
const KEY_USER = "user";

export async function signup(name, password) {
  const res = await fetch("http://localhost:4000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
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
  const res = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Login failed");
  if (json.token) localStorage.setItem(KEY_TOKEN, json.token);
  if (json.user) localStorage.setItem(KEY_USER, JSON.stringify(json.user));
  return json;
}

export function logout() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
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
