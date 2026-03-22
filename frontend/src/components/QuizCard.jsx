import React from 'react';
import './QuizCard.css';

const QuizCard = ({ title, description, category, difficulty }) => {
  return (
    <div className="quiz-card">
      <h2 className="quiz-title">{title}</h2>
      <p className="quiz-description">{description}</p>
      <div className="quiz-meta">
        <span className="quiz-category">{category}</span>
        <span className="quiz-difficulty">Difficulty: {difficulty}</span>
      </div>
      <div className="quiz-actions">
        <button className="start-quiz">Start Quiz</button>
        <button className="view-quiz">View Details</button>
      </div>
    </div>
  );
};

export default QuizCard;