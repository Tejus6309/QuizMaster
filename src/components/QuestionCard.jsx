import OptionButton from './OptionButton.jsx'
import { Flag } from './icons/Icons.jsx'

const letters = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuestionCard({ question, selectedOption, showResult, onSelect, isMarked, onToggleMark }) {
  if (!question) return null

  return (
    <div className="question-card">
      <div className="question-card__header">
        <p className="question-card__text">{question.question}</p>
        {onToggleMark && (
          <button
            type="button"
            className={`question-card__mark-btn ${isMarked ? 'question-card__mark-btn--active' : ''}`}
            onClick={onToggleMark}
            title={isMarked ? 'Unmark question' : 'Mark question for review'}
          >
            <Flag filled={isMarked} />
            <span>{isMarked ? 'Marked' : 'Mark'}</span>
          </button>
        )}
      </div>
      <div className="question-card__options">
        {question.options.map((opt, i) => (
          <OptionButton
            key={i}
            option={opt.opt}
            index={i}
            letter={letters[i]}
            state={{
              isCorrect: opt.isCorrect,
              isSelected: selectedOption === i,
              hasUserAnswered: selectedOption !== null,
              showResult,
            }}
            onSelect={onSelect}
          />
        ))}

      </div>
    </div>
  )
}

