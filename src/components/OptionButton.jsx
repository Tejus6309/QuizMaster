import { Check, X } from './icons/Icons.jsx'

export default function OptionButton({ option, index, state, onSelect, letter }) {
  const { isCorrect, isSelected, showResult, hasUserAnswered } = state

  let className = 'option-button'
  if (showResult && hasUserAnswered && isCorrect) className += ' option-button--correct'
  else if (showResult && isSelected && !isCorrect) className += ' option-button--wrong'
  else if (showResult) className += ' option-button--dimmed'

  return (
    <button
      className={className}
      onClick={() => onSelect(index)}
      disabled={showResult}
    >
      <span className="option-button__letter">{letter}</span>
      <span className="option-button__text">{option}</span>
      {showResult && hasUserAnswered && isCorrect && <Check className="option-button__icon" />}
      {showResult && isSelected && !isCorrect && <X className="option-button__icon" />}
    </button>
  )
}

