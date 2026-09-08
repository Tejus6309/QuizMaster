import { getGrade, formatTime } from '../utils/helpers.js'
import { Flame, Target, Trophy, Clock } from './icons/Icons.jsx'

export default function ResultSummary({ correct, total, percentage, accuracy, skipped = 0, totalTime, isPersonalBest }) {
  const grade = getGrade(percentage)
  const avgTimePerQuestion = total > 0 ? (totalTime / total).toFixed(1) : 0
  const computedAccuracy = accuracy !== undefined ? accuracy : Math.round((correct / Math.max(1, total - skipped)) * 100)

  return (
    <div className="result-summary">
      {isPersonalBest && (
        <div className="result-summary__pb-badge">
          <Flame className="pb-icon" /> NEW PERSONAL BEST!
        </div>
      )}

      <div className={`result-summary__grade result-summary__grade--${grade.letter}`}>
        {grade.letter}
      </div>
      <h2 className="result-summary__label">{grade.label}</h2>

      <div className="result-summary__stats">
        <div className="result-summary__stat">
          <span className="result-summary__stat-value">{percentage}%</span>
          <span className="result-summary__stat-label">Score</span>
        </div>

        <div className="result-summary__stat">
          <div className="stat-with-icon">
            <Target className="stat-icon" />
            <span className="result-summary__stat-value">{computedAccuracy}%</span>
          </div>
          <span className="result-summary__stat-label">Accuracy</span>
        </div>

        <div className="result-summary__stat">
          <span className="result-summary__stat-value">{correct}/{total}</span>
          <span className="result-summary__stat-label">Correct</span>
        </div>

        <div className="result-summary__stat">
          <div className="stat-with-icon">
            <Clock className="stat-icon" />
            <span className="result-summary__stat-value">{formatTime(totalTime)}</span>
          </div>
          <span className="result-summary__stat-label">Total Time ({avgTimePerQuestion}s/q)</span>
        </div>
      </div>
    </div>
  )
}

