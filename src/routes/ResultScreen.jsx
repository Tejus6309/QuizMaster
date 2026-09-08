import { useState, useMemo, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import ResultSummary from '../components/ResultSummary.jsx'
import ReviewList from '../components/ReviewList.jsx'
import { RotateCcw, Home, Trophy, HistoryIcon, RefreshCw, Flame } from '../components/icons/Icons.jsx'
import { saveResult } from '../utils/storage.js'
import { categories } from '../data/questionBank.js'

export default function ResultScreen({ result, onRestart, onHome, onRetryWrong, onViewHistory }) {
  const [showReview, setShowReview] = useState(false)
  const [savedEntry, setSavedEntry] = useState(null)
  const savedRef = useRef(null)

  const { correctCount, incorrectCount, skippedCount, percentage, accuracy } = useMemo(() => {
    if (!result || !result.questions || !result.answers) {
      return { correctCount: 0, incorrectCount: 0, skippedCount: 0, percentage: 0, accuracy: 0 }
    }

    let correct = 0
    let skipped = 0
    let incorrect = 0

    result.questions.forEach((q, i) => {
      const ans = result.answers[i]
      if (ans === undefined || ans === null) {
        skipped += 1
      } else if (q.options[ans]?.isCorrect) {
        correct += 1
      } else {
        incorrect += 1
      }
    })

    const total = result.questions.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const acc = total - skipped > 0 ? Math.round((correct / (total - skipped)) * 100) : 0

    return { correctCount: correct, incorrectCount: incorrect, skippedCount: skipped, percentage: pct, accuracy: acc }
  }, [result])

  const categoryName = useMemo(() => {
    if (!result || !result.questions) return ''
    const cat = categories.find((c) => c.id === result.questions[0]?.category)
    return cat ? cat.name : 'Mixed'
  }, [result])

  const wrongQuestions = useMemo(() => {
    if (!result || !result.questions || !result.answers) return []
    return result.questions.filter((q, i) => {
      const ans = result.answers[i]
      return ans === undefined || ans === null || !q.options[ans]?.isCorrect
    })
  }, [result])

  useEffect(() => {
    if (result && savedRef.current !== result) {
      savedRef.current = result

      const entry = saveResult({
        id: result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        categoryName,
        percentage,
        accuracy,
        correct: correctCount,
        incorrect: incorrectCount,
        skipped: skippedCount,
        total: result.questions.length,
        time: result.totalTime,
        date: new Date().toISOString(),
      })

      setSavedEntry(entry)

      if (percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }
  }, [result, categoryName, percentage, accuracy, correctCount, incorrectCount, skippedCount])

  if (!result) {
    return (
      <div className="result-screen">
        <div className="result-screen__empty">
          <p>No quiz results to show.</p>
          <button className="btn btn--primary" onClick={onHome}>
            Back to Start
          </button>
        </div>
      </div>
    )
  }

  const isPersonalBest = savedEntry?.isPersonalBest

  return (
    <div className="result-screen">
      <div className="result-screen__header">
        <Trophy className={`result-screen__trophy ${isPersonalBest ? 'result-screen__trophy--pb' : ''}`} />
        <h2 className="result-screen__title">Quiz Complete!</h2>
        <p className="result-screen__category">{categoryName} • {result.questions.length} Questions</p>
      </div>

      <ResultSummary
        correct={correctCount}
        total={result.questions.length}
        percentage={percentage}
        accuracy={accuracy}
        skipped={skippedCount}
        totalTime={result.totalTime}
        isPersonalBest={isPersonalBest}
      />

      <div className="result-screen__actions">
        {wrongQuestions.length > 0 && (
          <button
            className="btn btn--accent"
            onClick={() => onRetryWrong(wrongQuestions)}
            title="Retry only the questions you got wrong or skipped"
          >
            <RefreshCw /> Retry Wrong Questions ({wrongQuestions.length})
          </button>
        )}

        <button className="btn btn--primary" onClick={() => setShowReview(!showReview)}>
          {showReview ? 'Hide Review' : 'Review Answers'}
        </button>

        <button className="btn btn--secondary" onClick={onRestart}>
          <RotateCcw /> Play Again
        </button>

        <button className="btn btn--ghost" onClick={onViewHistory}>
          <HistoryIcon /> Attempt History
        </button>

        <button className="btn btn--ghost" onClick={onHome}>
          <Home /> Home
        </button>
      </div>

      {showReview && (
        <ReviewList
          questions={result.questions}
          answers={result.answers}
          markedForReview={result.markedForReview}
        />
      )}
    </div>
  )
}

