import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css'; // Import CSS for styling

const ProgressBar = ({ currentQuestion, totalQuestions }) => {
  const percentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="progress-container">
      <div className="progress-text">
        Question {currentQuestion} of {totalQuestions} - {Math.round(percentage)}%
      </div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  currentQuestion: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
};

export default ProgressBar;