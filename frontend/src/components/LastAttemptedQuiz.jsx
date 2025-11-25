import React, { useState, useEffect } from "react";
import { getLastAttemptedQuiz } from "../lib/apiClient";

const LastAttemptedQuiz = ({ onViewResults, onViewAnalytics }) => {
  const [lastQuiz, setLastQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLastAttempted();
  }, []);

  const loadLastAttempted = async () => {
    try {
      setLoading(true);
      const data = await getLastAttemptedQuiz();
      setLastQuiz(data);
    } catch (err) {
      if (
        err.message.includes("404") ||
        err.message.includes("No attempted quizzes")
      ) {
        setLastQuiz(null);
      } else {
        setError("Failed to load last attempted quiz");
      }
      console.error("Error loading last attempted quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getPerformanceBadge = (percentage) => {
    if (percentage >= 80) return "bg-green-900 text-green-200";
    if (percentage >= 60) return "bg-yellow-900 text-yellow-200";
    return "bg-red-900 text-red-200";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading last attempted quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!lastQuiz) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">
          No quiz attempts yet
        </h3>
        <p className="text-gray-400">
          Join a quiz to see your performance here!
        </p>
      </div>
    );
  }

  const { quiz, submission, questionResults, participant } = lastQuiz;
  const correctAnswers = questionResults.filter((q) => q.isCorrect).length;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        Your Last Quiz Attempt
      </h3>

      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 border border-purple-700">
        {/* Quiz Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-white text-xl mb-1">{quiz.name}</h4>
            <p className="text-purple-200 text-sm">
              Code: <span className="font-mono font-medium">{quiz.code}</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceBadge(
                submission.percentage
              )}`}
            >
              {submission.percentage}% Score
            </span>
            {quiz.deadlinePassed && (
              <p className="text-xs text-gray-400 mt-1">Results Available</p>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-black bg-opacity-20 rounded-lg p-3">
            <div
              className={`text-xl font-bold ${getPerformanceColor(
                submission.percentage
              )}`}
            >
              {submission.rawScore}
            </div>
            <div className="text-xs text-gray-300">Points Earned</div>
          </div>
          <div className="bg-black bg-opacity-20 rounded-lg p-3">
            <div className="text-xl font-bold text-white">
              {correctAnswers}/{quiz.totalQuestions}
            </div>
            <div className="text-xs text-gray-300">Correct Answers</div>
          </div>
          <div className="bg-black bg-opacity-20 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-400">
              {quiz.totalParticipants}
            </div>
            <div className="text-xs text-gray-300">Total Participants</div>
          </div>
          <div className="bg-black bg-opacity-20 rounded-lg p-3">
            <div className="text-xl font-bold text-gray-400">
              {formatDate(submission.submittedAt).split(",")[0]}
            </div>
            <div className="text-xs text-gray-300">Submitted</div>
          </div>
        </div>

        {/* Quick Question Overview */}
        {quiz.deadlinePassed && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">
              Question Results:
            </h5>
            <div className="flex flex-wrap gap-2">
              {questionResults.map((q, index) => (
                <div
                  key={q.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    q.isCorrect
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                  title={`Question ${index + 1}: ${
                    q.isCorrect ? "Correct" : "Incorrect"
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {quiz.deadlinePassed ? (
            <>
              <button
                onClick={() => onViewResults(lastQuiz)}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                📊 View Detailed Results
              </button>
              <button
                onClick={() => onViewAnalytics(lastQuiz)}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
              >
                📈 View Analytics
              </button>
            </>
          ) : (
            <div className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-medium text-gray-400 text-center">
              Results available after deadline: {formatDate(quiz.deadline)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LastAttemptedQuiz;
