import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categories, difficultyLevels, questionCounts } from '../data/questionBank.js'
import { ArrowRight, HistoryIcon, Trophy, Flame, RefreshCw, AlertCircle, Sparkles } from '../components/icons/Icons.jsx'
import { getAllResults, getBestScore } from '../utils/storage.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
import { fetchTriviaQuestions, OPEN_TDB_CATEGORIES } from '../services/triviaApi.js'
import { useToast } from '../context/ToastContext.jsx'

function ShoppingBagIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function GlobeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function BookOpenIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

/**
 * Enhanced Challenge Setup & Quiz Configuration
 * Practical topics:
 * - Consuming REST APIs with fetch/axios
 * - Loading states, retry, and error handling
 * - Working with third-party APIs
 * - State architecture in React apps
 */
export default function ConfigScreen({ config, setConfig, onStart, onViewHistory }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { studyCart } = useQuizStore()

  const [mode, setMode] = useState('curated') // 'curated' | 'rest_api'
  const [error, setError] = useState('')
  const [resultsVersion, setResultsVersion] = useState(0)

  // REST API Async Fetch State
  const [apiCategory, setApiCategory] = useState('all')
  const [apiDifficulty, setApiDifficulty] = useState('all')
  const [apiAmount, setApiAmount] = useState(10)
  const [isLoadingApi, setIsLoadingApi] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const handleUpdate = () => setResultsVersion((v) => v + 1)
    window.addEventListener('quizmaster-results-updated', handleUpdate)
    return () => window.removeEventListener('quizmaster-results-updated', handleUpdate)
  }, [])

  const results = useMemo(() => getAllResults(user?.id), [user, resultsVersion])
  const recentResults = results.slice(0, 3)
  const bestScore = useMemo(() => getBestScore(null, user?.id), [user, resultsVersion])

  const handleStartCurated = () => {
    if (!config.category) {
      setError('Please select a category')
      return
    }
    if (!config.difficulty) {
      setError('Please select a difficulty')
      return
    }
    if (!config.count) {
      setError('Please select number of questions')
      return
    }
    setError('')
    setConfig((prev) => ({ ...prev, customQuestions: null }))
    onStart()
  }

  // REST API Fetch via Axios with Retry & Error Handling
  const handleFetchAndStartApi = async (isRetry = false) => {
    setError('')
    setApiError(null)
    setIsLoadingApi(true)
    if (isRetry) setIsRetrying(true)

    try {
      const result = await fetchTriviaQuestions({
        amount: apiAmount,
        category: apiCategory,
        difficulty: apiDifficulty,
      })

      if (result.success && result.questions?.length > 0) {
        showToast(
          `Successfully retrieved ${result.questions.length} questions from Open Trivia DB!`,
          'success'
        )
        setConfig((prev) => ({
          ...prev,
          category: 'online-api',
          difficulty: apiDifficulty,
          count: result.questions.length,
          customQuestions: result.questions,
        }))
        onStart()
      } else {
        setApiError(result.error || 'Failed to fetch online trivia questions.')
      }
    } catch (err) {
      setApiError(err.message || 'An unexpected network error occurred.')
    } finally {
      setIsLoadingApi(false)
      setIsRetrying(false)
    }
  }

  const handleFallbackToLocal = () => {
    setMode('curated')
    setConfig((prev) => ({
      ...prev,
      category: 'all',
      difficulty: 'all',
      count: 10,
      customQuestions: null,
    }))
    setApiError(null)
    showToast('Switched back to curated offline question bank', 'info')
  }

  return (
    <div className="config-screen">
      <header className="config-header">
        <div className="config-header__main">
          <div className="config-header__pill">
            <span className="pill-dot"></span>
            <span>
              {user
                ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0]}!`
                : 'Interactive Knowledge Challenge'}
            </span>
          </div>
          <h1 className="config-header__title">QuizMaster</h1>
          <p className="config-header__subtitle">
            Customize your challenge parameters and test your knowledge
          </p>
        </div>
        <button
          type="button"
          className="config-header__history-btn"
          onClick={onViewHistory}
          title="View all past quiz attempts and statistics"
        >
          <HistoryIcon />
          <span>Attempt History</span>
          {results.length > 0 && (
            <span className="config-header__history-badge">{results.length}</span>
          )}
        </button>
      </header>

      {/* Mode Selector: Curated Local Bank vs Live REST API */}
      <div className="qm-source-selector">
        <button
          type="button"
          className={`qm-source-btn ${mode === 'curated' ? 'qm-source-btn--active' : ''}`}
          onClick={() => {
            setMode('curated')
            setApiError(null)
          }}
        >
          <BookOpenIcon className="qm-source-icon" />
          <div className="qm-source-info">
            <span className="qm-source-title">Curated Question Bank</span>
            <span className="qm-source-desc">High-speed, offline-ready questions with curated explanations</span>
          </div>
        </button>

        <button
          type="button"
          className={`qm-source-btn ${mode === 'rest_api' ? 'qm-source-btn--active' : ''}`}
          onClick={() => {
            setMode('rest_api')
            setError('')
          }}
        >
          <GlobeIcon className="qm-source-icon" />
          <div className="qm-source-info">
            <span className="qm-source-title">Live Trivia REST API (Axios)</span>
            <span className="qm-source-desc">Fetch live questions dynamically from Open Trivia Database</span>
          </div>
        </button>
      </div>

      <div className="config-screen__layout">
        <div className="config-screen__main">
          {/* ================= CURATED BANK MODE ================= */}
          {mode === 'curated' && (
            <>
              <div className="config-screen__section">
                <div className="config-screen__section-header">
                  <h3 className="config-screen__section-label">1. Choose a Category</h3>
                  <span className="config-screen__section-count">{categories.length + 1} topics</span>
                </div>
                <div className="config-screen__categories">
                  <button
                    type="button"
                    className={`category-chip ${config.category === 'all' ? 'category-chip--active' : ''}`}
                    onClick={() => setConfig({ ...config, category: 'all' })}
                  >
                    <span className="category-chip__icon">🎲</span>
                    <div className="category-chip__info">
                      <span className="category-chip__subtitle">All subjects combined</span>
                      <span className="category-chip__title">Mixed</span>
                    </div>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-chip ${config.category === cat.id ? 'category-chip--active' : ''}`}
                      style={
                        config.category === cat.id
                          ? { '--chip-color': cat.color, borderColor: cat.color }
                          : {}
                      }
                      onClick={() => setConfig({ ...config, category: cat.id })}
                    >
                      <span className="category-chip__icon">{cat.icon}</span>
                      <div className="category-chip__info">
                        <span className="category-chip__title">{cat.name}</span>
                        <span className="category-chip__subtitle">Topic questions</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-screen__section">
                <h3 className="config-screen__section-label">2. Select Difficulty</h3>
                <div className="config-screen__difficulties">
                  {difficultyLevels.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`difficulty-chip ${config.difficulty === d.id ? 'difficulty-chip--active' : ''}`}
                      onClick={() => setConfig({ ...config, difficulty: d.id })}
                    >
                      <span className="difficulty-chip__name">{d.name}</span>
                      <span className="difficulty-chip__desc">{d.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-screen__section">
                <h3 className="config-screen__section-label">3. Number of Questions</h3>
                <div className="config-screen__counts">
                  {questionCounts.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`count-chip ${config.count === n ? 'count-chip--active' : ''}`}
                      onClick={() => setConfig({ ...config, count: n })}
                    >
                      <span className="count-chip__num">{n}</span>
                      <span className="count-chip__label">Questions</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="config-screen__error">{error}</p>}

              <button
                type="button"
                className="config-screen__start-btn"
                onClick={handleStartCurated}
              >
                <span>Start Challenge</span>
                <ArrowRight className="config-screen__start-icon" />
              </button>
            </>
          )}

          {/* ================= LIVE REST API (AXIOS) MODE ================= */}
          {mode === 'rest_api' && (
            <div className="qm-api-config-box">
              <div className="qm-api-badge-pill">
                <GlobeIcon />
                <span>Consuming Open Trivia DB REST API with Axios</span>
              </div>

              <div className="config-screen__section">
                <h3 className="config-screen__section-label">1. Select Online Trivia Category</h3>
                <div className="qm-api-category-grid">
                  {OPEN_TDB_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-chip ${apiCategory === cat.id ? 'category-chip--active' : ''}`}
                      onClick={() => setApiCategory(cat.id)}
                    >
                      <span className="category-chip__icon">🌐</span>
                      <div className="category-chip__info">
                        <span className="category-chip__title">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-screen__section">
                <h3 className="config-screen__section-label">2. Target Difficulty</h3>
                <div className="config-screen__difficulties">
                  {[
                    { id: 'all', name: 'Any Difficulty', desc: 'Mixed challenge' },
                    { id: 'easy', name: 'Easy', desc: 'Relaxed questions' },
                    { id: 'medium', name: 'Medium', desc: 'Standard challenge' },
                    { id: 'hard', name: 'Hard', desc: 'Expert depth' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`difficulty-chip ${apiDifficulty === d.id ? 'difficulty-chip--active' : ''}`}
                      onClick={() => setApiDifficulty(d.id)}
                    >
                      <span className="difficulty-chip__name">{d.name}</span>
                      <span className="difficulty-chip__desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-screen__section">
                <h3 className="config-screen__section-label">3. Questions to Fetch via API</h3>
                <div className="config-screen__counts">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`count-chip ${apiAmount === n ? 'count-chip--active' : ''}`}
                      onClick={() => setApiAmount(n)}
                    >
                      <span className="count-chip__num">{n}</span>
                      <span className="count-chip__label">Questions</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error & Retry Banner */}
              {apiError && (
                <div className="qm-api-error-card">
                  <div className="qm-api-error-card__header">
                    <AlertCircle className="qm-api-error-icon" />
                    <h4>API Request Failed</h4>
                  </div>
                  <p>{apiError}</p>
                  <div className="qm-api-error-actions">
                    <button
                      type="button"
                      className="btn btn--secondary qm-btn-flex"
                      onClick={() => handleFetchAndStartApi(true)}
                      disabled={isLoadingApi}
                    >
                      <RefreshCw className={isRetrying ? 'spin' : ''} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry Request'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={handleFallbackToLocal}
                    >
                      Fallback to Curated Questions
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="config-screen__start-btn"
                onClick={() => handleFetchAndStartApi(false)}
                disabled={isLoadingApi}
              >
                {isLoadingApi ? (
                  <>
                    <RefreshCw className="spin qm-btn-spinner" />
                    <span>Fetching Questions via Axios...</span>
                  </>
                ) : (
                  <>
                    <span>Fetch & Launch Online Quiz</span>
                    <ArrowRight className="config-screen__start-icon" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <aside className="config-screen__sidebar">
          {/* Study Cart Quick Practice Widget */}
          {studyCart.length > 0 && (
            <div className="config-sidebar-card qm-cart-widget">
              <div className="qm-cart-widget__badge">
                <ShoppingBagIcon />
                <span>Saved Study Cart</span>
              </div>
              <h4 className="qm-cart-widget__title">{studyCart.length} Questions Ready</h4>
              <p className="qm-cart-widget__desc">
                Practice only the questions you have bookmarked during reviews or challenges.
              </p>
              <Link to="/deck" className="btn btn--primary qm-btn-flex" style={{ width: '100%', marginTop: '10px' }}>
                <Sparkles />
                <span>Open Study Deck</span>
              </Link>
            </div>
          )}

          {bestScore ? (
            <div
              className="config-sidebar-card pb-card"
              onClick={onViewHistory}
              title="View all attempt history"
            >
              <div className="pb-card__header">
                <span className="pb-card__tag">
                  <Flame /> Personal Best
                </span>
                <span className="pb-card__arrow">&rarr;</span>
              </div>
              <div className="pb-card__body">
                <div className="pb-card__score">{bestScore.percentage}%</div>
                <p className="pb-card__cat">{bestScore.categoryName}</p>
                <div className="pb-card__meta">
                  <span>
                    {bestScore.correct}/{bestScore.total} Correct
                  </span>
                  <span>•</span>
                  <span>
                    {bestScore.accuracy !== undefined ? bestScore.accuracy : bestScore.percentage}% Accuracy
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="config-sidebar-card pb-card pb-card--empty">
              <div className="pb-card__header">
                <span className="pb-card__tag">
                  <Trophy /> No Records Yet
                </span>
              </div>
              <p className="pb-card__desc">Complete a quiz to set your first personal high score!</p>
            </div>
          )}

          <div className="config-sidebar-card recent-card">
            <div className="recent-card__header">
              <h4 className="recent-card__title">Recent Attempts</h4>
              {results.length > 0 && (
                <button type="button" className="btn-link" onClick={onViewHistory}>
                  View All ({results.length})
                </button>
              )}
            </div>

            {recentResults.length > 0 ? (
              <div className="recent-card__list">
                {recentResults.map((r, i) => (
                  <div key={r.id || i} className="recent-item">
                    <div className="recent-item__left">
                      <span className="recent-item__cat">{r.categoryName}</span>
                      <span className="recent-item__date">
                        {new Date(r.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="recent-item__right">
                      <span
                        className={`recent-item__score ${r.percentage >= 80 ? 'recent-item__score--high' : ''}`}
                      >
                        {r.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recent-card__empty">
                <p>No recent activity. Start a quiz to track your performance!</p>
              </div>
            )}
          </div>

          <div className="config-sidebar-card tips-card">
            <h4 className="tips-card__title">Quick Tips</h4>
            <ul className="tips-card__list">
              <li>
                ⏱️ <strong>20s Per Question:</strong> Speed & accuracy both count.
              </li>
              <li>
                🛍️ <strong>Study Cart:</strong> Bookmark tricky questions and practice them together.
              </li>
              <li>
                🌐 <strong>REST API:</strong> Switch to Live Trivia API for real-time questions via Axios.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}