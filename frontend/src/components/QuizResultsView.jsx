import React from "react";

const QuizResultsView = ({ quizData, onBack }) => {
  const { quiz, submission, questionResults, participant } = quizData;

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

  const getChoiceStyle = (choice, question, userAnswer) => {
    const isCorrect = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.includes(choice)
      : question.correctAnswer === choice;
    const isSelected = Array.isArray(userAnswer)
      ? userAnswer.includes(choice)
      : userAnswer === choice;

    if (isCorrect && isSelected) {
      return "bg-green-100 border-green-500 text-green-800"; // Correct and selected
    } else if (isCorrect) {
      return "bg-green-50 border-green-300 text-green-700"; // Correct but not selected
    } else if (isSelected) {
      return "bg-red-100 border-red-500 text-red-800"; // Wrong and selected
    } else {
      return "bg-gray-50 border-gray-200 text-gray-600"; // Not selected
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
      </div>

      {/* Quiz Summary Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              {quiz.name}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Participant:</span>
                <span className="text-white">{participant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quiz Code:</span>
                <span className="text-white font-mono">{quiz.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Submitted:</span>
                <span className="text-white">
                  {formatDate(submission.submittedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Deadline:</span>
                <span className="text-white">{formatDate(quiz.deadline)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${getPerformanceColor(
                  submission.percentage
                )}`}
              >
                {submission.percentage}%
              </div>
              <p className="text-gray-400">Final Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-white">
                  {submission.rawScore}
                </div>
                <div className="text-xs text-gray-400">Points Earned</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {submission.totalPoints}
                </div>
                <div className="text-xs text-gray-400">Total Points</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {questionResults.filter((q) => q.isCorrect).length}/
                  {quiz.totalQuestions}
                </div>
                <div className="text-xs text-gray-400">Correct</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          Question-by-Question Review
        </h3>

        {questionResults.map((question, index) => (
          <div
            key={question.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Question {index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      question.isCorrect
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}
                  >
                    {question.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {question.earnedPoints}/{question.points} points
                  </span>
                </div>
                <p className="text-white text-lg">{question.content}</p>
              </div>
            </div>

            {/* Question Choices */}
            {question.type !== "text" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300 mb-3">
                  Options:
                </p>
                {question.choices &&
                  question.choices.map((choice, choiceIndex) => (
                    <div
                      key={choiceIndex}
                      className={`p-3 rounded-lg border-2 ${getChoiceStyle(
                        choice,
                        question,
                        question.userAnswer
                      )}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {String.fromCharCode(65 + choiceIndex)}.
                        </span>
                        <span>{choice}</span>
                        {Array.isArray(question.correctAnswer)
                          ? question.correctAnswer.includes(choice) && (
                              <span className="ml-auto text-green-600">
                                ✓ Correct
                              </span>
                            )
                          : question.correctAnswer === choice && (
                              <span className="ml-auto text-green-600">
                                ✓ Correct
                              </span>
                            )}
                        {Array.isArray(question.userAnswer)
                          ? question.userAnswer.includes(choice) && (
                              <span className="ml-auto text-blue-600">
                                Your Choice
                              </span>
                            )
                          : question.userAnswer === choice && (
                              <span className="ml-auto text-blue-600">
                                Your Choice
                              </span>
                            )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Text Question */}
            {question.type === "text" && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    Your Answer:
                  </p>
                  <div className="bg-gray-700 p-3 rounded border">
                    <span className="text-white">
                      {question.userAnswer || "No answer provided"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    Correct Answer:
                  </p>
                  <div className="bg-green-900 bg-opacity-30 p-3 rounded border border-green-600">
                    <span className="text-green-200">
                      {question.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Performance Summary
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {questionResults.filter((q) => q.isCorrect).length}
            </div>
            <p className="text-gray-400">Correct Answers</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {questionResults.filter((q) => !q.isCorrect).length}
            </div>
            <p className="text-gray-400">Incorrect Answers</p>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getPerformanceColor(
                submission.percentage
              )}`}
            >
              {submission.percentage}%
            </div>
            <p className="text-gray-400">Overall Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsView;
