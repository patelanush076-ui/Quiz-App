import { useState, useEffect } from "react";
import { joinRoom, getRoom } from "../lib/roomService";

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

  useEffect(() => {
    if (user && !initialName) setName(user.name);
  }, [user, initialName]);

  async function handleJoin(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const room = await getRoom(code.toUpperCase());
      if (!room) throw new Error("Room not found");
      const result = await joinRoom(code.toUpperCase(), name, {
        useToken: !joinAnonymously,
      });
      // result: { room, participantId }
      onJoined(result.room || result, name, result.participantId);
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
            className="w-full mt-1 p-2 rounded bg-slate-800 text-white"
            placeholder="ABC123"
          />
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
            className="w-full mt-1 p-2 rounded bg-slate-800 text-white"
            placeholder="Player"
          />
        </div>
        {error && <p className="text-red-400">{error}</p>}
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
