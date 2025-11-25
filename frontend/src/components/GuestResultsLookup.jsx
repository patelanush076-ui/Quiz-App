import React, { useState } from "react";
import { getGuestQuizResults } from "../lib/apiClient";

const GuestResultsLookup = ({ onViewResults }) => {
  const [quizCode, setQuizCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e) => {
    e.preventDefault();

    if (!quizCode.trim() || !participantName.trim()) {
      setError("Please enter both quiz code and participant name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const results = await getGuestQuizResults(
        quizCode.trim(),
        participantName.trim()
      );
      onViewResults(results);
    } catch (err) {
      setError(err.message || "Failed to find quiz results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        Check Your Quiz Results
      </h3>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔍</div>
          <h4 className="text-lg font-medium text-white mb-2">
            Find Your Quiz Results
          </h4>
          <p className="text-gray-400 text-sm">
            Enter your quiz code and the name you used when taking the quiz to
            view your results.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label
              htmlFor="quizCode"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Quiz Code *
            </label>
            <input
              type="text"
              id="quizCode"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              placeholder="Enter quiz code (e.g., ABC123)"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              maxLength={10}
            />
          </div>

          <div>
            <label
              htmlFor="participantName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Your Name *
            </label>
            <input
              type="text"
              id="participantName"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter the name you used when joining the quiz"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !quizCode.trim() || !participantName.trim()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <span>🔍</span>
                Find My Results
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-600">
          <h5 className="text-sm font-medium text-blue-200 mb-2">
            📋 How it works:
          </h5>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Enter the exact quiz code provided by your instructor</li>
            <li>• Use the same name you entered when joining the quiz</li>
            <li>
              • Results are only available after the quiz deadline has passed
            </li>
            <li>
              • For better tracking, consider creating an account next time!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GuestResultsLookup;
