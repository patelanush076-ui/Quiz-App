import { useState, useEffect } from "react";
import { validateQuizTitle, validateUsername } from "../lib/validation";
import { apiFetch } from "../lib/apiClient";

export default function QuizBuilder({ user, onQuizCreated, onCancel }) {
  const [quiz, setQuiz] = useState({
    title: "",
    deadline: "",
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    content: "",
    type: "multiple-choice",
    choices: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white/5 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold mb-4">Create a Quiz</h2>
        <p className="text-gray-300 mb-6">You must log in to create a quiz.</p>
      </div>
    );
  }

  function validateQuizForm() {
    const errors = {};

    if (!quiz.title.trim()) {
      errors.title = "Quiz title is required";
    } else if (quiz.title.trim().length < 3) {
      errors.title = "Quiz title must be at least 3 characters";
    }

    if (!quiz.deadline) {
      errors.deadline = "Deadline is required";
    } else if (new Date(quiz.deadline) <= new Date()) {
      errors.deadline = "Deadline must be in the future";
    }

    if (quiz.questions.length === 0) {
      errors.questions = "At least one question is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateQuestion() {
    if (!currentQuestion.content.trim()) return "Question content is required";
    if (currentQuestion.type === "multiple-choice") {
      const validChoices = currentQuestion.choices.filter((c) => c.trim());
      if (validChoices.length < 2) return "At least 2 choices are required";
      if (!currentQuestion.choices[currentQuestion.correctAnswer]?.trim()) {
        return "Please select a valid correct answer";
      }
    }
    return null;
  }

  function addOrUpdateQuestion() {
    const error = validateQuestion();
    if (error) {
      setError(error);
      return;
    }

    const question = {
      ...currentQuestion,
      content: currentQuestion.content.trim(),
      choices:
        currentQuestion.type === "multiple-choice"
          ? currentQuestion.choices.filter((c) => c.trim())
          : null,
    };

    if (editingIndex >= 0) {
      const updated = [...quiz.questions];
      updated[editingIndex] = question;
      setQuiz({ ...quiz, questions: updated });
      setEditingIndex(-1);
    } else {
      setQuiz({ ...quiz, questions: [...quiz.questions, question] });
    }

    // Reset form
    setCurrentQuestion({
      content: "",
      type: "multiple-choice",
      choices: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
    });
    setError("");
  }

  function editQuestion(index) {
    const question = quiz.questions[index];
    setCurrentQuestion({
      ...question,
      choices: question.choices || ["", "", "", ""],
    });
    setEditingIndex(index);
  }

  function deleteQuestion(index) {
    const updated = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: updated });
  }

  function updateChoice(index, value) {
    const updated = [...currentQuestion.choices];
    updated[index] = value;
    setCurrentQuestion({ ...currentQuestion, choices: updated });
  }

  async function handleCreateQuiz() {
    if (!validateQuizForm()) return;

    setLoading(true);
    setError("");

    try {
      // Create quiz
      const quizResponse = await apiFetch("/api/quizzes", {
        method: "POST",
        body: {
          title: quiz.title.trim(),
          adminName: user.name,
          deadline: quiz.deadline,
        },
      });

      if (!quizResponse.ok) {
        const errorData = await quizResponse.json();
        throw new Error(errorData.message || "Failed to create quiz");
      }

      const { quiz: createdQuiz } = await quizResponse.json();

      // Add questions
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const questionResponse = await apiFetch(
          `/api/quizzes/${createdQuiz.code}/questions`,
          {
            method: "POST",
            body: {
              content: question.content,
              type: question.type,
              choices: question.choices,
              answer:
                question.type === "multiple-choice"
                  ? question.choices[question.correctAnswer]
                  : question.content,
              points: question.points,
              order: i + 1,
            },
          }
        );

        if (!questionResponse.ok) {
          throw new Error(`Failed to add question ${i + 1}`);
        }
      }

      // Activate the quiz
      await apiFetch(`/api/quizzes/${createdQuiz.code}`, {
        method: "PATCH",
        body: { active: true },
      });

      onQuizCreated && onQuizCreated(createdQuiz);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Set minimum datetime to current time
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto bg-white/5 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Create Quiz</h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Quiz Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-200 mb-2">Quiz Title</label>
          <input
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            className={`w-full p-3 rounded bg-slate-800 text-white ${
              validationErrors.title ? "border-2 border-red-500" : ""
            }`}
            placeholder="Enter quiz title"
          />
          {validationErrors.title && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.title}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-200 mb-2">Deadline</label>
          <input
            type="datetime-local"
            value={quiz.deadline}
            onChange={(e) => setQuiz({ ...quiz, deadline: e.target.value })}
            min={minDateTimeString}
            className={`w-full p-3 rounded bg-slate-800 text-white ${
              validationErrors.deadline ? "border-2 border-red-500" : ""
            }`}
          />
          {validationErrors.deadline && (
            <p className="text-red-400 text-sm mt-1">
              {validationErrors.deadline}
            </p>
          )}
        </div>
      </div>

      {/* Question Form */}
      <div className="bg-slate-800/50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingIndex >= 0 ? "Edit Question" : "Add Question"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-200 mb-2">Question</label>
            <textarea
              value={currentQuestion.content}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  content: e.target.value,
                })
              }
              className="w-full p-3 rounded bg-slate-700 text-white"
              placeholder="Enter your question"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-200 mb-2">Type</label>
              <select
                value={currentQuestion.type}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    type: e.target.value,
                  })
                }
                className="w-full p-3 rounded bg-slate-700 text-white"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="text">Text Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-200 mb-2">Points</label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    points: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
                className="w-full p-3 rounded bg-slate-700 text-white"
              />
            </div>
          </div>

          {currentQuestion.type === "multiple-choice" && (
            <div>
              <label className="block text-sm text-gray-200 mb-2">
                Answer Choices
              </label>
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: index,
                        })
                      }
                      className="text-green-500"
                    />
                    <input
                      value={choice}
                      onChange={(e) => updateChoice(index, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="flex-1 p-2 rounded bg-slate-700 text-white"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Select the radio button next to the correct answer
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addOrUpdateQuestion}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
            >
              {editingIndex >= 0 ? "Update Question" : "Add Question"}
            </button>
            {editingIndex >= 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(-1);
                  setCurrentQuestion({
                    content: "",
                    type: "multiple-choice",
                    choices: ["", "", "", ""],
                    correctAnswer: 0,
                    points: 1,
                  });
                }}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {quiz.questions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Questions ({quiz.questions.length})
          </h3>
          <div className="space-y-3">
            {quiz.questions.map((question, index) => (
              <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {index + 1}. {question.content}
                    </p>
                    <p className="text-sm text-gray-400">
                      Type: {question.type} | Points: {question.points}
                    </p>
                    {question.choices && (
                      <div className="mt-2 text-sm">
                        {question.choices.map((choice, choiceIndex) => (
                          <div
                            key={choiceIndex}
                            className={`${
                              choiceIndex === question.correctAnswer
                                ? "text-green-400 font-medium"
                                : "text-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + choiceIndex)}. {choice}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editQuestion(index)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestion(index)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {validationErrors.questions && (
        <p className="text-red-400 text-sm mb-4">
          {validationErrors.questions}
        </p>
      )}

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {/* Create Quiz Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreateQuiz}
          disabled={loading || quiz.questions.length === 0}
          className="px-6 py-3 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Creating Quiz..." : "Create Quiz"}
        </button>
      </div>
    </div>
  );
}
