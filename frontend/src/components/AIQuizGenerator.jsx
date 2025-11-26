import React, { useState } from "react";
import { apiFetch } from "../lib/apiClient";

const AIQuizGenerator = ({ onQuizGenerated, onCancel }) => {
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please provide a description for your quiz");
      return;
    }

    if (prompt.trim().length < 10) {
      setError(
        "Please provide a more detailed description (at least 10 characters)"
      );
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await apiFetch("/api/ai/generate-quiz", {
        method: "POST",
        body: {
          prompt: prompt.trim(),
          difficulty,
          questionCount,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate quiz");
      }

      const quizData = await response.json();
      onQuizGenerated(quizData);
    } catch (err) {
      console.error("AI Quiz Generation Error:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const examples = [
    "Create a quiz about JavaScript fundamentals including variables, functions, and arrays",
    "Make a history quiz about World War II events and key figures",
    "Generate a science quiz covering basic chemistry and the periodic table",
    "Create a geography quiz about European countries and their capitals",
    "Make a literature quiz about Shakespeare's plays and characters",
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            🤖 Create Quiz with AI
          </h2>
          <p className="text-gray-400 mt-1">
            Describe your quiz and let AI generate questions for you
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Quiz Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quiz Description *
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your quiz topic, subject area, or specific learning objectives..."
            className="w-full p-3 rounded bg-slate-800 text-white border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            rows="4"
            disabled={generating}
          />
          <p className="text-xs text-gray-400 mt-1">
            {prompt.length}/500 characters. Be specific about the topic,
            difficulty level, and any particular areas to focus on.
          </p>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-3 rounded bg-slate-800 text-white border border-slate-600 focus:border-indigo-500 focus:outline-none"
              disabled={generating}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full p-3 rounded bg-slate-800 text-white border border-slate-600 focus:border-indigo-500 focus:outline-none"
              disabled={generating}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} question{i !== 0 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Examples */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            💡 Example Prompts
          </label>
          <div className="grid gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-gray-300 hover:text-white transition-colors text-sm"
                disabled={generating}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Quiz...
              </>
            ) : (
              <>🪄 Generate Quiz with AI</>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-xl">ℹ️</span>
            <div className="text-blue-200 text-sm">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-blue-300">
                <li>
                  • AI will generate {questionCount} {difficulty} difficulty
                  questions
                </li>
                <li>• Each question will have 4 multiple-choice options</li>
                <li>
                  • You can review and edit questions before creating the quiz
                </li>
                <li>• Generation typically takes 10-30 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuizGenerator;
