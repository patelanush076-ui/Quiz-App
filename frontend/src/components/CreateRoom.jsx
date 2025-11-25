import { useState, useEffect } from "react";
import { createRoom, joinRoom } from "../lib/roomService";

export default function CreateRoom({ user = null, onCreated }) {
  const [title, setTitle] = useState("Quick Quiz");
  const [hostName, setHostName] = useState(user ? user.name : "Host");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom({ title, hostName });
      // join host as participant to get participantId
      try {
        const j = await joinRoom(room.code, hostName, {
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
            className="w-full mt-1 p-2 rounded bg-slate-800 text-white"
            placeholder="Fun trivia"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-200">Your name</label>
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full mt-1 p-2 rounded bg-slate-800 text-white"
            placeholder="Host"
          />
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
