import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuestionBank } from '../hooks/useQuestionBank.js'
import { useQuizTimer } from '../hooks/useQuizTimer.js'
import QuestionCard from '../components/QuestionCard.jsx'
import QuestionPalette from '../components/QuestionPalette.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Timer from '../components/Timer.jsx'
import { ArrowRight, ArrowLeft, SkipForward, Flag, RefreshCw, Clock } from '../components/icons/Icons.jsx'


const TIME_PER_QUESTION = 20

export default function QuizScreen({ config, onFinish }) {
  const questions = useQuestionBank(config)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [markedForReview, setMarkedForReview] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [timeoutNotice, setTimeoutNotice] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const autoAdvanceTimeoutRef = useRef(null)

  const handleFinishQuiz = useCallback(() => {
    const finalAnswers = questions.map((_, i) => (answers[i] !== undefined ? answers[i] : null))
    onFinish({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      questions,
      answers: finalAnswers,
      markedForReview,
      totalTime,
    })
  }, [questions, answers, markedForReview, totalTime, onFinish])

  const goToNext = useCallback(() => {
    setTimeoutNotice(false)
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1
      setCurrentIndex(nextIdx)
      setShowResult(answers[nextIdx] !== undefined && answers[nextIdx] !== null)
    } else {
      handleFinishQuiz()
    }
  }, [currentIndex, questions.length, answers, handleFinishQuiz])

  const handleTimeout = useCallback(() => {
    if (!showResult) {
      // Record answer as null (timed out / skipped) if not answered yet
      setAnswers((prev) => {
        const next = [...prev]
        if (next[currentIndex] === undefined) {
          next[currentIndex] = null
        }
        return next
      })
      setShowResult(true)

      if (autoAdvance) {
        setTimeoutNotice(true)
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          goToNext()
        }, 1200)
      }
    }
  }, [showResult, currentIndex, autoAdvance, goToNext])

  const isTimerRunning = !showResult && !timeoutNotice && !confirmSubmit && questions.length > 0 && currentIndex < questions.length
  const { timeLeft, reset } = useQuizTimer(TIME_PER_QUESTION, handleTimeout, isTimerRunning)

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      reset()
      setShowResult(answers[currentIndex] !== undefined && answers[currentIndex] !== null)
    }
    return () => {
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
    }
  }, [currentIndex, questions.length, reset])


  useEffect(() => {
    if (questions.length > 0) {
      const interval = setInterval(() => {
        setTotalTime((t) => t + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [questions.length])

  if (questions.length === 0) {
    return (
      <div className="quiz-screen">
        <div className="quiz-screen__empty">
          <p>No questions match your selection. Try a different combination.</p>
          <button className="btn btn--primary" onClick={() => onFinish(null)}>
            Back to Start
          </button>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  if (!question) return null
  const selectedOption = answers[currentIndex] !== undefined ? answers[currentIndex] : null

  const isMarked = !!markedForReview[currentIndex]

  const handleSelect = (index) => {
    if (showResult && answers[currentIndex] !== undefined && answers[currentIndex] !== null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = index
      return next
    })
    setShowResult(true)
  }

  const handlePrev = () => {
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
    setTimeoutNotice(false)
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1
      setCurrentIndex(prevIdx)
      setShowResult(answers[prevIdx] !== undefined && answers[prevIdx] !== null)
    }
  }

  const handleSkip = () => {
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
    setTimeoutNotice(false)
    setAnswers((prev) => {
      const next = [...prev]
      if (next[currentIndex] === undefined) {
        next[currentIndex] = null
      }
      return next
    })
    goToNext()
  }

  const handleToggleMark = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }))
  }

  const handleJumpToQuestion = (index) => {
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current)
    setTimeoutNotice(false)
    setCurrentIndex(index)
    setShowResult(answers[index] !== undefined && answers[index] !== null)
  }

  const isCorrect = showResult && selectedOption !== null && question.options[selectedOption]?.isCorrect
  const unansweredCount = questions.filter((_, i) => answers[i] === undefined || answers[i] === null).length
  const markedCount = Object.values(markedForReview).filter(Boolean).length
  const answeredCount = questions.length - unansweredCount

  return (
    <div className="quiz-screen">
      <header className="quiz-screen__header">
        <div className="quiz-screen__header-meta">
          <div className="quiz-screen__category-badge">
            <span className="badge-dot" />
            <span className="badge-cat-name">{question.category || config.category || 'Quiz'}</span>
            <span className="badge-sep">•</span>
            <span className="badge-diff">{question.difficulty || config.difficulty || 'Medium'}</span>
          </div>
          <div className="quiz-screen__counter">
            Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong>
          </div>
        </div>

        <div className="quiz-screen__header-progress">
          <ProgressBar current={currentIndex} total={questions.length} />
        </div>

        <div className="quiz-screen__header-timer">
          <Timer timeLeft={timeLeft} duration={TIME_PER_QUESTION} />
        </div>
      </header>

      {timeoutNotice && (
        <div className="quiz-screen__timeout-toast">
          <Clock className="toast-icon" />
          <span>Time's up! Auto-advancing to next question...</span>
        </div>
      )}

      <div className="quiz-screen__mobile-toolbar">
        <button
          type="button"
          className={`quiz-screen__palette-toggle ${showPalette ? 'quiz-screen__palette-toggle--active' : ''}`}
          onClick={() => setShowPalette(!showPalette)}
        >
          <span>Question Grid ({currentIndex + 1}/{questions.length})</span>
          {markedCount > 0 && <span className="badge badge--amber">{markedCount} marked</span>}
        </button>

        <label className="quiz-screen__autoadvance-toggle" title="Auto advance to next question when timer runs out">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
          />
          <span>Auto-advance</span>
        </label>
      </div>

      <div className="quiz-screen__layout">
        <main className="quiz-screen__main">
          <QuestionCard
            question={question}
            selectedOption={selectedOption}
            showResult={showResult}
            onSelect={handleSelect}
            isMarked={isMarked}
            onToggleMark={handleToggleMark}
          />

          {showResult && (
            <div className="quiz-screen__feedback">
              <p className={`quiz-screen__feedback-text ${isCorrect ? 'quiz-screen__feedback-text--correct' : 'quiz-screen__feedback-text--wrong'}`}>
                {isCorrect ? 'Correct!' : selectedOption === null ? "Time's up!" : 'Not quite!'}
              </p>
              {question.explanation && (
                <div className="quiz-screen__explanation-box">
                  <span className="quiz-screen__explanation-label">Explanation:</span>
                  <p className="quiz-screen__explanation">{question.explanation}</p>
                </div>
              )}
            </div>
          )}

          <div className="quiz-screen__nav-bar">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ArrowLeft /> Prev
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleSkip}
            >
              <SkipForward /> Skip
            </button>

            {currentIndex + 1 < questions.length ? (
              <button type="button" className="btn btn--primary" onClick={goToNext}>
                Next <ArrowRight />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--success"
                onClick={() => (unansweredCount > 0 ? setConfirmSubmit(true) : handleFinishQuiz())}
              >
                Submit Quiz
              </button>
            )}
          </div>
        </main>

        <aside className={`quiz-screen__sidebar ${showPalette ? 'quiz-screen__sidebar--visible' : ''}`}>
          <div className="quiz-screen__sidebar-card">
            <div className="quiz-sidebar-stats">
              <div className="sidebar-stat-chip sidebar-stat-chip--answered">
                <span className="sidebar-stat-val">{answeredCount}</span>
                <span className="sidebar-stat-lbl">Answered</span>
              </div>
              <div className="sidebar-stat-chip sidebar-stat-chip--marked">
                <span className="sidebar-stat-val">{markedCount}</span>
                <span className="sidebar-stat-lbl">Flagged</span>
              </div>
              <div className="sidebar-stat-chip sidebar-stat-chip--unanswered">
                <span className="sidebar-stat-val">{unansweredCount}</span>
                <span className="sidebar-stat-lbl">Pending</span>
              </div>
            </div>

            <QuestionPalette
              total={questions.length}
              currentIndex={currentIndex}
              answers={answers}
              markedForReview={markedForReview}
              onSelectQuestion={handleJumpToQuestion}
            />

            <div className="quiz-sidebar-actions">
              <button
                type="button"
                className={`sidebar-flag-btn ${isMarked ? 'sidebar-flag-btn--active' : ''}`}
                onClick={handleToggleMark}
              >
                <Flag filled={isMarked} />
                <span>{isMarked ? 'Question Flagged' : 'Flag for Review'}</span>
              </button>

              <label className="sidebar-autoadvance-toggle" title="Auto advance to next question when timer runs out">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                />
                <span>Auto-advance on timeout</span>
              </label>

              <button
                type="button"
                className="sidebar-submit-btn"
                onClick={() => (unansweredCount > 0 ? setConfirmSubmit(true) : handleFinishQuiz())}
              >
                Finish Quiz Early
              </button>
            </div>
          </div>
        </aside>
      </div>

      {confirmSubmit && (
        <div className="quiz-screen__modal-overlay">
          <div className="quiz-screen__modal">
            <h3>Submit Quiz?</h3>
            <p>
              {unansweredCount > 0
                ? `You still have ${unansweredCount} unanswered question(s).`
                : 'Are you sure you want to finish and review your results?'}
            </p>
            <div className="quiz-screen__modal-actions">
              <button className="btn btn--secondary" onClick={() => setConfirmSubmit(false)}>
                Continue Quiz
              </button>
              <button className="btn btn--primary" onClick={handleFinishQuiz}>
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

