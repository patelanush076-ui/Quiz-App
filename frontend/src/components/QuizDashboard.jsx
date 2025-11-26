import { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";

export default function QuizDashboard({ quiz, user, onBack }) {
  const [quizData, setQuizData] = useState(quiz);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);

  useEffect(() => {
    // Set initial data from prop
    if (quiz && quiz.title) {
      setQuizData(quiz);
    }
    loadQuizData();
  }, [quiz.code]);

  useEffect(() => {
    // Load submissions if deadline passed OR if user is admin
    if (quizData && (isDeadlinePassed() || isQuizAdmin())) {
      loadSubmissions();
    }
  }, [quizData, user]);

  async function loadQuizData() {
    try {
      const response = await apiFetch(`/api/quizzes/${quiz.code}`);
      if (response.ok) {
        const data = await response.json();
        setQuizData(data.quiz);
      }
    } catch (err) {
      setError("Failed to load quiz data");
    }
  }

  async function loadSubmissions() {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/quizzes/${quiz.code}/result`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz() {
    try {
      const response = await apiFetch(`/api/quizzes/${quiz.code}/start`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setQuizData(data.quiz);
      }
    } catch (err) {
      setError("Failed to start quiz");
    }
  }

  function isDeadlinePassed() {
    return quizData.deadline && new Date(quizData.deadline) < new Date();
  }

  function isQuizAdmin() {
    const adminId = quizData?.adminId || quiz?.adminId;
    return user && user.id === adminId;
  }

  async function updateDeadline() {
    try {
      // Validate deadline is selected
      if (!newDeadline) {
        setError("Please select a deadline");
        return;
      }

      setError(""); // Clear any previous errors
      setIsSavingDeadline(true); // Start loading

      const response = await apiFetch(`/api/quizzes/${quiz.code}`, {
        method: "PATCH",
        body: { deadline: newDeadline },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizData(data.quiz);
        setIsEditingDeadline(false);
        setNewDeadline("");
        // Reload submissions if needed
        if (isDeadlinePassed() || isQuizAdmin()) {
          loadSubmissions();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update deadline");
      }
    } catch (err) {
      console.error("Update deadline error:", err);
      setError("Failed to update deadline. Please try again.");
    } finally {
      setIsSavingDeadline(false); // End loading
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log("Copied to clipboard");
    });
  }

  function startEditingDeadline() {
    const currentDeadline = quizData.deadline
      ? new Date(quizData.deadline).toISOString().slice(0, 16)
      : "";
    setNewDeadline(currentDeadline);
    setIsEditingDeadline(true);
    setError(""); // Clear any existing errors
  }

  function cancelEditingDeadline() {
    setIsEditingDeadline(false);
    setNewDeadline("");
    setError(""); // Clear any existing errors
    setIsSavingDeadline(false); // Clear loading state
  }

  const shareUrl = `${window.location.origin}?code=${quizData.code}&name=${
    user?.name || "Player"
  }`;
  const deadlinePassed = isDeadlinePassed();
  const quizStarted = quizData.started;

  return (
    <div className="max-w-6xl mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{quizData.title}</h2>
          <p className="text-gray-400">Quiz Code: {quizData.code}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Status</h3>
          <p
            className={`font-semibold ${
              deadlinePassed
                ? "text-red-400"
                : quizStarted
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {deadlinePassed
              ? "Deadline Passed"
              : quizStarted
              ? "Active"
              : "Not Started"}
          </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm text-gray-400">Deadline</h3>
            {isQuizAdmin() && !isEditingDeadline && (
              <button
                onClick={startEditingDeadline}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          {isEditingDeadline ? (
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                disabled={isSavingDeadline}
                className="w-full px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex gap-2">
                <button
                  onClick={updateDeadline}
                  disabled={isSavingDeadline}
                  className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isSavingDeadline ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  onClick={cancelEditingDeadline}
                  disabled={isSavingDeadline}
                  className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="font-semibold">
              {quizData.deadline
                ? new Date(quizData.deadline).toLocaleString()
                : "No deadline"}
            </p>
          )}
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Questions</h3>
          <p className="font-semibold">{quizData.questions?.length || 0}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Participants</h3>
          <p className="font-semibold">{quizData.participants?.length || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          {(deadlinePassed || isQuizAdmin()) && (
            <button
              onClick={() => {
                setActiveTab("results");
                loadSubmissions();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "results"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Results
              {isQuizAdmin() && !deadlinePassed && (
                <span className="ml-1 text-xs text-yellow-400">(Preview)</span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Share Section */}
          <div className="bg-slate-800/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Share Quiz</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Quiz Code
                </label>
                <div className="flex gap-2">
                  <input
                    value={quizData.code}
                    readOnly
                    className="flex-1 p-3 rounded bg-slate-700 text-white font-mono text-lg"
                  />
                  <button
                    onClick={() => copyToClipboard(quizData.code)}
                    className="px-4 py-3 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-3 rounded bg-slate-700 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-3 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Control */}
          {!deadlinePassed && !quizStarted && (
            <div className="bg-slate-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quiz Control</h3>
              <button
                onClick={startQuiz}
                className="px-6 py-3 rounded bg-green-600 hover:bg-green-700 font-medium"
              >
                Start Quiz Now
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Starting the quiz will allow participants to begin answering
                questions.
              </p>
            </div>
          )}

          {/* Questions Preview */}
          {quizData.questions && quizData.questions.length > 0 && (
            <div className="bg-slate-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Questions</h3>
              <div className="space-y-4">
                {quizData.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-600 p-4 rounded"
                  >
                    <p className="font-medium">
                      {index + 1}. {question.content}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Type: {question.type} | Points: {question.points}
                    </p>
                    {question.choices && (
                      <div className="mt-2 text-sm">
                        {question.choices.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="text-gray-300">
                            {String.fromCharCode(65 + choiceIndex)}. {choice}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "results" && (deadlinePassed || isQuizAdmin()) && (
        <div className="space-y-6">
          {/* Admin Notice for Preview */}
          {isQuizAdmin() && !deadlinePassed && (
            <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">👁️</span>
                <span className="font-medium text-yellow-200">
                  Admin Preview
                </span>
              </div>
              <p className="text-yellow-300 text-sm">
                You're viewing submissions before the deadline as the quiz
                creator. Participants cannot see these results until the
                deadline passes.
              </p>
              <p className="text-yellow-400 text-xs mt-2">
                Deadline:{" "}
                {quizData.deadline
                  ? new Date(quizData.deadline).toLocaleString()
                  : "No deadline set"}
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading results...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-400">No submissions yet.</p>
              {!deadlinePassed && (
                <p className="text-gray-500 text-sm mt-2">
                  Participants can still submit until the deadline.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quiz Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-slate-700">
                    <tr>
                      <th className="px-6 py-3">Participant</th>
                      <th className="px-6 py-3">Score</th>
                      <th className="px-6 py-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .sort((a, b) => b.score - a.score)
                      .map((submission, index) => (
                        <tr
                          key={submission.id}
                          className={
                            index % 2 === 0 ? "bg-slate-800" : "bg-slate-700"
                          }
                        >
                          <td className="px-6 py-4 font-medium text-white">
                            {submission.participant?.username || "Anonymous"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-semibold ${
                                submission.score >= 80
                                  ? "text-green-400"
                                  : submission.score >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {submission.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
