import { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";

function storageKey(code) {
  return `quiz:${code}:answers`;
}

export default function QuizTaker({
  code,
  participantId,
  onSubmitted,
  onCancel,
}) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load quiz questions on mount
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/quizzes/${code}`, {
          includeAuth: true,
        });
        if (!res.ok) throw new Error("Failed to load quiz");
        const json = await res.json();

        setQuiz(json.quiz);

        // Load saved answers from localStorage
        const saved = localStorage.getItem(storageKey(code));
        if (saved) {
          try {
            setAnswers(JSON.parse(saved));
          } catch (e) {
            console.warn("Failed to parse saved answers", e);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [code]);

  // Save answers to localStorage whenever they change
  function handleAnswerChange(questionId, value, type) {
    const newAnswers = { ...answers };

    if (type === "multi-choice") {
      const arr = newAnswers[questionId] || [];
      const idx = arr.indexOf(value);
      if (idx === -1) {
        arr.push(value);
      } else {
        arr.splice(idx, 1);
      }
      newAnswers[questionId] = arr;
    } else {
      newAnswers[questionId] = value;
    }

    setAnswers(newAnswers);
    // Save to localStorage
    try {
      localStorage.setItem(storageKey(code), JSON.stringify(newAnswers));
    } catch (e) {
      console.warn("Failed to save answers to localStorage", e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/quizzes/${code}/submit`, {
        method: "POST",
        body: { participantId, answers },
        includeAuth: true,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to submit quiz");
      }

      const json = await res.json();
      // Clear localStorage after successful submission
      localStorage.removeItem(storageKey(code));
      onSubmitted && onSubmitted(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
        <p className="text-red-400">{error || "Quiz not found"}</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 rounded bg-slate-700"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        <p className="text-gray-400 mt-1">{quiz.questions.length} questions</p>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions.map((question) => (
          <div
            key={question.id}
            className="p-4 rounded bg-slate-800 border border-slate-700"
          >
            <div className="mb-3">
              <p className="font-semibold text-white">
                {question.order}. {question.content}
              </p>
              {question.points && (
                <p className="text-sm text-gray-400 mt-1">
                  Points: {question.points}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {question.type === "single-choice" && (
                <div>
                  {question.choices?.map((choice) => (
                    <label
                      key={choice.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={choice.id}
                        checked={answers[question.id] === choice.id}
                        onChange={() =>
                          handleAnswerChange(
                            question.id,
                            choice.id,
                            "single-choice"
                          )
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-200">{choice.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "multi-choice" && (
                <div>
                  {question.choices?.map((choice) => (
                    <label
                      key={choice.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={choice.id}
                        checked={(answers[question.id] || []).includes(
                          choice.id
                        )}
                        onChange={() =>
                          handleAnswerChange(
                            question.id,
                            choice.id,
                            "multi-choice"
                          )
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-200">{choice.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "text" && (
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value, "text")
                  }
                  placeholder="Enter your answer"
                  className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded bg-slate-700 hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
