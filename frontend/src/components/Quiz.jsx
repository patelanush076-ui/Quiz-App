import { useEffect, useState } from "react";
import { getRoom, joinRoom } from "../lib/roomService";
import { apiFetch } from "../lib/apiClient";

function storageKey(code) {
  return `quiz:${code}:answers`;
}

export default function Quiz({ code, participantId, onFinished }) {
  const [room, setRoom] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      const r = await getRoom(code);
      setRoom(r);
      const s = localStorage.getItem(storageKey(code));
      if (s) setAnswers(JSON.parse(s));
      // if no participantId provided, try to use localStorage or auto-join as guest
      if (!participantId) {
        const existingPid = localStorage.getItem("participantId");
        if (existingPid) {
          // keep it
        } else {
          try {
            const user = "Guest" + Math.floor(Math.random() * 10000);
            const res = await joinRoom(code, user, {
              useToken: !!localStorage.getItem("jwt"),
            });
            if (res && res.participantId) {
              localStorage.setItem("participantId", res.participantId);
            }
          } catch (e) {
            /* ignore */
          }
        }
      }
    }
    load();
  }, [code]);

  function saveLocal(newAnswers) {
    setAnswers(newAnswers);
    try {
      localStorage.setItem(storageKey(code), JSON.stringify(newAnswers));
    } catch (e) {}
  }

  function handleChange(qid, value, type) {
    setStatus(null);
    const next = { ...answers };
    if (type === "multi-choice") {
      const arr = next[qid] || [];
      const idx = arr.indexOf(value);
      if (idx === -1) arr.push(value);
      else arr.splice(idx, 1);
      next[qid] = arr;
    } else {
      next[qid] = value;
    }
    saveLocal(next);
  }

  async function handleSubmit(e) {
    e && e.preventDefault && e.preventDefault();
    setStatus("submitting");
    try {
      let pid = participantId || localStorage.getItem("participantId");
      if (!pid) {
        // try to join as guest
        try {
          const resj = await joinRoom(
            code,
            "Guest" + Math.floor(Math.random() * 10000),
            {
              useToken: !!localStorage.getItem("jwt"),
            }
          );
          pid = resj.participantId;
          localStorage.setItem("participantId", pid);
        } catch (e) {}
      }
      const res = await apiFetch(`/api/quizzes/${code}/submit`, {
        method: "POST",
        body: { participantId: pid, answers },
        includeAuth: true,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Submission failed");
      setResult({ score: json.score, detail: json.detail });
      setStatus("done");
      // clear local answers
      localStorage.removeItem(storageKey(code));
    } catch (err) {
      setStatus("error");
    }
  }

  function renderQuestion(q) {
    const value = answers[q.id];
    if (q.type === "single-choice") {
      return (
        <div className="space-y-1">
          {q.choices?.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={q.id}
                value={c.id}
                checked={value === c.id}
                onChange={() => handleChange(q.id, c.id, "single-choice")}
              />
              <span className="ml-2">{c.label}</span>
            </label>
          ))}
        </div>
      );
    } else if (q.type === "multi-choice") {
      return (
        <div className="space-y-1">
          {q.choices?.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(value || []).includes(c.id)}
                onChange={() => handleChange(q.id, c.id, "multi-choice")}
              />
              <span className="ml-2">{c.label}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <div>
        <input
          value={value || ""}
          onChange={(e) => handleChange(q.id, e.target.value)}
          className="w-full p-2 rounded bg-slate-800"
        />
      </div>
    );
  }

  if (!room) return <div>Loading questions...</div>;

  if (status === "done" && result) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
        <h3 className="text-xl">Submitted — Your score: {result.score}</h3>
        <pre className="text-sm mt-3 bg-slate-800 p-3 rounded">
          {JSON.stringify(result.detail, null, 2)}
        </pre>
        <div className="mt-4">
          <button
            onClick={onFinished}
            className="px-4 py-2 rounded bg-indigo-600"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
      <h3 className="text-lg font-semibold">{room.title}</h3>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {room.questions.map((q) => (
          <div key={q.id} className="p-3 rounded bg-slate-800">
            <div className="font-medium">
              {q.order}. {q.content}
            </div>
            <div className="mt-2">{renderQuestion(q)}</div>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <button type="submit" className="px-4 py-2 rounded bg-emerald-600">
            Submit answers
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-slate-700"
            onClick={onFinished}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
