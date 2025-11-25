import { useState } from "react";
import authService from "../lib/authService";
import { validateUsername, validatePassword } from "../lib/validation";

export default function Signup({ onSignedUp }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  function validateForm() {
    const errors = {};

    const nameErrors = validateUsername(name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors[0];
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0];
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authService.signup(name, password);
      onSignedUp && onSignedUp(res.user);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      <form onSubmit={handleSignup} className="space-y-4">
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
        <div>
          <label className="block text-sm text-gray-200">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.confirmPassword ? "border-2 border-red-500" : ""
            }`}
            placeholder="Confirm password"
          />
          {validationErrors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.confirmPassword}
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
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
