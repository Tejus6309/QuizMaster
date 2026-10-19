import { useState, useMemo, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import ResultSummary from '../components/ResultSummary.jsx'
import ReviewList from '../components/ReviewList.jsx'
import Breadcrumbs from '../components/common/Breadcrumbs.jsx'
import { RotateCcw, Home, Trophy, HistoryIcon, RefreshCw } from '../components/icons/Icons.jsx'
import { saveResult } from '../utils/storage.js'
import { categories } from '../data/questionBank.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
import { useToast } from '../context/ToastContext.jsx'
import { syncQuizResultToSupabase } from '../lib/supabase.js'

function ShoppingBagIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export default function ResultScreen({ result, onRestart, onHome, onRetryWrong, onViewHistory }) {
  const { user } = useAuth()
  const { addToCart } = useQuizStore()
  const { showToast } = useToast()
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
    return cat ? cat.name : result.questions[0]?.category || 'Mixed'
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

      const entry = saveResult(
        {
          id: result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: user?.id || 'guest',
          userEmail: user?.email || 'guest',
          categoryName,
          percentage,
          accuracy,
          correct: correctCount,
          incorrect: incorrectCount,
          skipped: skippedCount,
          total: result.questions.length,
          time: result.totalTime,
          date: new Date().toISOString(),
        },
        user?.id
      )

      setSavedEntry(entry)

      if (entry && user) {
        syncQuizResultToSupabase(entry, user)
      }

      if (percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }
  }, [result, categoryName, percentage, accuracy, correctCount, incorrectCount, skippedCount, user])

  const handleAddAllWrongToCart = () => {
    let addedCount = 0
    wrongQuestions.forEach((q) => {
      if (addToCart(q)) addedCount++
    })
    showToast(
      addedCount > 0
        ? `Added ${addedCount} tricky question(s) to your Study Cart!`
        : 'All missed questions are already in your Study Cart!',
      addedCount > 0 ? 'success' : 'info'
    )
  }

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
      <Breadcrumbs items={[{ label: 'Quiz Result' }]} />

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
          <>
            <button
              className="btn btn--accent qm-btn-flex"
              onClick={() => onRetryWrong(wrongQuestions)}
              title="Retry only the questions you got wrong or skipped"
            >
              <RefreshCw />
              <span>Retry Missed ({wrongQuestions.length})</span>
            </button>

            <button
              className="btn btn--secondary qm-btn-flex"
              onClick={handleAddAllWrongToCart}
              title="Save all missed questions into your Study Cart for later practice"
            >
              <ShoppingBagIcon />
              <span>Save Missed to Cart ({wrongQuestions.length})</span>
            </button>
          </>
        )}

        <button className="btn btn--primary" onClick={() => setShowReview(!showReview)}>
          {showReview ? 'Hide Review' : 'Review Answers'}
        </button>

        <button className="btn btn--secondary qm-btn-flex" onClick={onRestart}>
          <RotateCcw />
          <span>Play Again</span>
        </button>

        <button className="btn btn--ghost qm-btn-flex" onClick={onViewHistory}>
          <HistoryIcon />
          <span>Attempt History</span>
        </button>

        <button className="btn btn--ghost qm-btn-flex" onClick={onHome}>
          <Home />
          <span>Home</span>
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
