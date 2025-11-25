import { useEffect, useState } from "react";
import { getRoom, startRoom } from "../lib/roomService";

export default function Room({
  code,
  yourName,
  isHost,
  onStart,
  participantId,
}) {
  const [room, setRoom] = useState(null);

  async function refreshRoom() {
    const r = await getRoom(code);
    setRoom(r);
  }

  useEffect(() => {
    refreshRoom();
    const id = setInterval(refreshRoom, 1500);
    return () => clearInterval(id);
  }, [code]);

  if (!room) {
    return <div className="p-6">Loading room...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-lg bg-white/5">
      <h3 className="text-lg font-semibold">{room.title}</h3>
      <p className="text-sm text-gray-300">
        Room code: <span className="font-mono">{room.code}</span>
      </p>
      <p className="mt-3">Host: {room.host}</p>
      <div className="mt-4">
        <p className="font-medium">Participants ({room.participants.length})</p>
        <ul className="mt-2 space-y-1">
          {room.participants.map((p) => (
            <li key={p} className="bg-slate-900 px-3 py-1 rounded">
              {p}
              {p === yourName ? " (you)" : ""}
              {p === room.host ? " (host)" : ""}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1">
          {isHost ? (
            <button
              className="px-4 py-2 rounded bg-indigo-600"
              onClick={async () => {
                await startRoom(code);
                refreshRoom();
                if (typeof onStart === "function") onStart();
              }}
            >
              Start quiz
            </button>
          ) : room.started ? (
            <button
              className="px-4 py-2 rounded bg-emerald-600"
              onClick={() => onStart && onStart()}
            >
              Take quiz
            </button>
          ) : (
            <div className="p-3 rounded bg-slate-800 text-sm">
              Waiting for the host to start the quiz...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-slate-700"
            onClick={() => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.set("code", room.code);
                url.searchParams.set("name", yourName || "");
                navigator.clipboard &&
                  navigator.clipboard.writeText(url.toString());
              } catch (e) {
                console.warn("Failed to copy url", e);
              }
            }}
          >
            Copy link
          </button>
          <button
            className="px-3 py-1 rounded bg-emerald-600"
            onClick={async () => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.set("code", room.code);
                url.searchParams.set("name", yourName || "");
                if (navigator.share) {
                  await navigator.share({
                    title: room.title,
                    text: "Join my quiz",
                    url: url.toString(),
                  });
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(url.toString());
                }
              } catch (e) {
                console.warn("Share failed", e);
              }
            }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
