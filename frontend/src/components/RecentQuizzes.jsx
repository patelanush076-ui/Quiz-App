import React, { useState, useEffect } from "react";
import { getUserQuizzes } from "../lib/apiClient";

const RecentQuizzes = ({ onViewDashboard, onViewAnalytics }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await getUserQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError("Failed to load quizzes");
      console.error("Error loading quizzes:", err);
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

  const getStatusColor = (status) => {
    return status === "completed" ? "text-green-400" : "text-blue-400";
  };

  const getStatusBadge = (status) => {
    return status === "completed"
      ? "bg-green-900 text-green-200"
      : "bg-blue-900 text-blue-200";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading your quizzes...</p>
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

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">
          No quizzes yet
        </h3>
        <p className="text-gray-400">Create your first quiz to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        Your Recent Quizzes
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* Quiz Header */}
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium text-white text-lg truncate pr-2">
                {quiz.name}
              </h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                  quiz.status
                )}`}
              >
                {quiz.status}
              </span>
            </div>

            {/* Quiz Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quiz Code:</span>
                <span className="text-white font-mono">{quiz.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Questions:</span>
                <span className="text-white">{quiz.questionCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Participants:</span>
                <span className="text-white">{quiz.participantCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Deadline:</span>
                <span className={getStatusColor(quiz.status)}>
                  {formatDate(quiz.deadline)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onViewDashboard(quiz)}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium transition-colors"
              >
                Dashboard
              </button>
              {quiz.status === "completed" && (
                <button
                  onClick={() => onViewAnalytics(quiz)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                >
                  Analytics
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {quizzes.length >= 5 && (
        <div className="text-center pt-4">
          <p className="text-gray-400 text-sm">
            Showing your 5 most recent quizzes
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentQuizzes;
