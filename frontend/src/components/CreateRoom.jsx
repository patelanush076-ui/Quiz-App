import { useState, useEffect } from "react";
import { createRoom, joinRoom } from "../lib/roomService";
import { validateQuizTitle, validateUsername } from "../lib/validation";

export default function CreateRoom({ user = null, onCreated, onNeedLogin }) {
  const [title, setTitle] = useState("Quick Quiz");
  const [hostName, setHostName] = useState(user ? user.name : "Host");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // If user not logged in, show login prompt
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold mb-4">Create a Quiz Room</h2>
        <p className="text-gray-300 mb-6">
          You must log in or sign up to create a quiz room.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onNeedLogin && onNeedLogin("login")}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
          >
            Login
          </button>
          <button
            onClick={() => onNeedLogin && onNeedLogin("signup")}
            className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700"
          >
            Sign up
          </button>
        </div>
      </div>
    );
  }

  function validateForm() {
    const errors = {};

    const titleErrors = validateQuizTitle(title);
    if (titleErrors.length > 0) {
      errors.title = titleErrors[0];
    }

    const nameErrors = validateUsername(hostName);
    if (nameErrors.length > 0) {
      errors.hostName = nameErrors[0];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const trimmedTitle = title.trim();
      const trimmedHostName = hostName.trim();

      const room = await createRoom({
        title: trimmedTitle,
        hostName: trimmedHostName,
      });
      // join host as participant to get participantId
      try {
        const j = await joinRoom(room.code, trimmedHostName, {
          useToken: !!user,
        });
        const pid = j.participantId;
        onCreated(room, pid);
      } catch (e) {
        onCreated(room);
      }
    } catch (err) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  // keep hostName in sync with user when provided
  useEffect(() => {
    if (user) setHostName(user.name);
  }, [user]);

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Create a quiz room</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-200">Quiz title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.title ? "border-2 border-red-500" : ""
            }`}
            placeholder="Fun trivia"
          />
          {validationErrors.title && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.title}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-200">Your name</label>
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.hostName ? "border-2 border-red-500" : ""
            }`}
            placeholder="Host"
          />
          {validationErrors.hostName && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.hostName}
            </p>
          )}
        </div>
        {error && <p className="text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create room"}
          </button>
        </div>
      </form>
    </div>
  );
}
