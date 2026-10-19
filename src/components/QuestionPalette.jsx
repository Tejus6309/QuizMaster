import { Flag } from './icons/Icons.jsx'

export default function QuestionPalette({ total, currentIndex, answers, markedForReview, onSelectQuestion }) {
  return (
    <div className="question-palette">
      <div className="question-palette__header">
        <span className="question-palette__title">Question Overview</span>
        <div className="question-palette__legend">
          <span className="legend-item legend-item--answered">
            <span className="legend-dot" /> Answered
          </span>
          <span className="legend-item legend-item--marked">
            <Flag className="legend-icon" filled /> Marked
          </span>
          <span className="legend-item legend-item--unanswered">
            <span className="legend-dot" /> Unanswered
          </span>
        </div>
      </div>
      <div className="question-palette__grid">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === currentIndex
          const isAnswered = answers[i] !== undefined && answers[i] !== null
          const isMarked = markedForReview[i] === true

          let statusClass = 'question-palette__btn--unanswered'
          if (isAnswered) statusClass = 'question-palette__btn--answered'
          if (isCurrent) statusClass += ' question-palette__btn--current'

          return (
            <button
              key={i}
              type="button"
              className={`question-palette__btn ${statusClass}`}
              onClick={() => onSelectQuestion(i)}
              title={`Question ${i + 1} ${isMarked ? '(Marked for review)' : ''}`}
            >
              <span>{i + 1}</span>
              {isMarked && <Flag className="question-palette__flag" filled />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
