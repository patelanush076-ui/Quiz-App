import { useState, useEffect } from "react";
import { joinRoom, getRoom } from "../lib/roomService";
import { validateQuizCode, validateUsername } from "../lib/validation";

export default function JoinRoom({
  onJoined,
  initialCode = "",
  initialName = "",
  user = null,
}) {
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState(
    initialName || (user ? user.name : "Player")
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinAnonymously, setJoinAnonymously] = useState(!user);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user && !initialName) setName(user.name);
  }, [user, initialName]);

  function validateForm() {
    const errors = {};

    const codeErrors = validateQuizCode(code);
    if (codeErrors.length > 0) {
      errors.code = codeErrors[0];
    }

    const nameErrors = validateUsername(name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors[0];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleJoin(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const upperCode = code.trim().toUpperCase();
      const trimmedName = name.trim();

      // Check quiz details first to validate deadline
      const room = await getRoom(upperCode);
      if (!room) throw new Error("Room not found");

      // If room has deadline information, check it
      if (room.deadline && new Date(room.deadline) < new Date()) {
        throw new Error("Cannot join quiz - deadline has passed");
      }

      const result = await joinRoom(upperCode, trimmedName, {
        useToken: !joinAnonymously,
      });
      // result: { room, participantId }
      onJoined(result.room || result, trimmedName, result.participantId);
      if (result && result.participantId) {
        try {
          localStorage.setItem("participantId", result.participantId);
        } catch (e) {}
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-join when both code and name are provided programmatically
    if (initialCode && initialName) {
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialName]);

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Join a quiz room</h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-200">Room code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.code ? "border-2 border-red-500" : ""
            }`}
            placeholder="ABC123"
          />
          {validationErrors.code && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.code}</p>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="join-anon"
              checked={joinAnonymously}
              onChange={() => setJoinAnonymously(!joinAnonymously)}
            />
            <label htmlFor="join-anon" className="text-sm text-gray-200">
              Join anonymously (do not use your account)
            </label>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-200">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full mt-1 p-2 rounded bg-slate-800 text-white ${
              validationErrors.name ? "border-2 border-red-500" : ""
            }`}
            placeholder="Player"
          />
          {validationErrors.name && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>
        {error && (
          <div className="p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <span className="font-medium text-red-200">Cannot Join Quiz</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            {error.includes("deadline has passed") && (
              <p className="text-red-400 text-xs mt-2">
                💡 Tip: Contact the quiz host if you think this is a mistake.
              </p>
            )}
          </div>
        )}
        <div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join room"}
          </button>
        </div>
      </form>
    </div>
  );
}
