import React from 'react';
import PropTypes from 'prop-types';

const ResultsDisplay = ({ score, correctCount, incorrectCount, categoryBreakdown, onRetakeQuiz, onExploreQuizzes }) => {
    const scorePercentage = ((correctCount / (correctCount + incorrectCount)) * 100).toFixed(2);

    return (
        <div className="results-display">
            <h2>Quiz Results</h2>
            <p><strong>Score Percentage:</strong> {scorePercentage}%</p>
            <p><strong>Correct Answers:</strong> {correctCount}</p>
            <p><strong>Incorrect Answers:</strong> {incorrectCount}</p>
            <div className="category-breakdown">
                <h3>Category Breakdown:</h3>
                <ul>
                    {Object.entries(categoryBreakdown).map(([category, count]) => (
                        <li key={category}>{category}: {count}</li>
                    ))}
                </ul>
            </div>
            <div className="actions">
                <button onClick={onRetakeQuiz}>Retake Quiz</button>
                <button onClick={onExploreQuizzes}>Explore More Quizzes</button>
            </div>
        </div>
    );
};

ResultsDisplay.propTypes = {
    score: PropTypes.number.isRequired,
    correctCount: PropTypes.number.isRequired,
    incorrectCount: PropTypes.number.isRequired,
    categoryBreakdown: PropTypes.object.isRequired,
    onRetakeQuiz: PropTypes.func.isRequired,
    onExploreQuizzes: PropTypes.func.isRequired,
};

export default ResultsDisplay;