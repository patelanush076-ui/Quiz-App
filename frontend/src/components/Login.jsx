import { useState } from "react";
import authService from "../lib/authService";
import { validateUsername } from "../lib/validation";

export default function Login({ onLoggedIn }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  function validateForm() {
    const errors = {};

    const nameErrors = validateUsername(name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors[0];
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authService.login(name, password);
      onLoggedIn && onLoggedIn(res.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-200">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.name ? "border-2 border-red-500" : ""
            }`}
            placeholder="Your name"
          />
          {validationErrors.name && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.password ? "border-2 border-red-500" : ""
            }`}
            placeholder="Password"
          />
          {validationErrors.password && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.password}
            </p>
          )}
        </div>
        {error && <p className="text-red-400">{error}</p>}
        <div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
