import React from 'react';
import PropTypes from 'prop-types';
import './QuestionComponent.css'; // Assuming styles are defined here

const QuestionComponent = ({ questionText, timer, progress, category }) => {
    return (
        <div className='question-component'>
            <div className='question-category-badge'>{category}</div>
            <h2 className='question-text'>{questionText}</h2>
            <div className='timer-display'>{timer} seconds left</div>
            <div className='progress-indicator'>Question {progress}</div>
        </div>
    );
};

QuestionComponent.propTypes = {
    questionText: PropTypes.string.isRequired,
    timer: PropTypes.number.isRequired,
    progress: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
};

export default QuestionComponent;