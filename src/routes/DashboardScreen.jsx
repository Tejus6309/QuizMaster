import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
import { useToast } from '../context/ToastContext.jsx'
import {
  getAllResults,
  getBestScore,
  syncResultsWithCloud,
  getLastSyncedTime,
} from '../utils/storage.js'
import { subscribeToQuizResults } from '../lib/supabase.js'
import { formatTime } from '../utils/helpers.js'
import { categories } from '../data/questionBank.js'
import Breadcrumbs from '../components/common/Breadcrumbs.jsx'
import SupabaseModal from '../components/SupabaseModal.jsx'
import {
  Trophy,
  Target,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Brain,
  RefreshCw,
  CloudCheck,
} from '../components/icons/Icons.jsx'

// Shopping Bag / Cart icon
function ShoppingBagIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function PlusCircleIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
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

/**
 * Mini Project: Interactive Analytics & Learning Dashboard
 * Synchronized across devices with Supabase Cloud
 */
export default function DashboardScreen({ onStartCustomQuiz }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { studyCart, customQuestions } = useQuizStore()
  const [resultsVersion, setResultsVersion] = useState(0)

  // Cloud Sync State
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSqlModal, setShowSqlModal] = useState(false)
  const [, setSyncState] = useState(() => ({
    synced: false,
    lastSynced: getLastSyncedTime(user?.id),
    error: null,
    tableMissing: false,
  }))

  // Listen for local storage updates
  useEffect(() => {
    const handleUpdate = () => setResultsVersion((v) => v + 1)
    window.addEventListener('quizmaster-results-updated', handleUpdate)
    return () => window.removeEventListener('quizmaster-results-updated', handleUpdate)
  }, [])

  // Two-way cloud sync trigger function
  const triggerCloudSync = useCallback(
    async (isSilent = false) => {
      if (!user) return
      if (!isSilent) setIsSyncing(true)

      try {
        const res = await syncResultsWithCloud(user)

        if (res.success) {
          setSyncState({
            synced: true,
            lastSynced: res.lastSynced || new Date(),
            error: null,
            tableMissing: false,
          })
          if (!isSilent) {
            showToast(
              res.remoteCount > 0
                ? `Fetched ${res.remoteCount} result(s) from Supabase Cloud! Synced across devices.`
                : 'Dashboard is up to date with Supabase Cloud!',
              'success'
            )
          }
        } else if (res.tableMissing) {
          setSyncState((prev) => ({
            ...prev,
            synced: false,
            tableMissing: true,
            error: 'Table "quiz_results" does not exist in Supabase yet.',
          }))
          if (!isSilent) {
            showToast(
              'Supabase connected! Run the SQL script to create the quiz_results table.',
              'info'
            )
          }
        } else if (res.error) {
          setSyncState((prev) => ({
            ...prev,
            synced: false,
            error: res.error,
          }))
          if (!isSilent) {
            showToast(`Sync issue: ${res.error}`, 'warning')
          }
        }
      } catch (err) {
        console.warn('Dashboard triggerCloudSync error:', err)
      } finally {
        if (!isSilent) setIsSyncing(false)
      }
    },
    [user, showToast]
  )

  // 1. Initial Cloud Sync on Mount or User Change
  useEffect(() => {
    if (!user) return
    let isCurrent = true
    syncResultsWithCloud(user).then((res) => {
      if (!isCurrent) return
      if (res.success) {
        setSyncState({
          synced: true,
          lastSynced: res.lastSynced || new Date(),
          error: null,
          tableMissing: false,
        })
      } else if (res.tableMissing) {
        setSyncState((prev) => ({
          ...prev,
          synced: false,
          tableMissing: true,
          error: 'Table "quiz_results" does not exist in Supabase yet.',
        }))
      }
    })
    return () => {
      isCurrent = false
    }
  }, [user])

  // 2. Cross-Device Realtime Updates: Subscribe to Postgres changes on `quiz_results`
  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToQuizResults(user, () => {
      // Remote device took a quiz: re-sync dashboard automatically
      triggerCloudSync(true)
    })
    return () => unsubscribe()
  }, [user, triggerCloudSync])

  // 3. Tab Refocus Auto-Sync: When user switches back from another device or tab
  useEffect(() => {
    const handleFocus = () => {
      if (user) triggerCloudSync(true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, triggerCloudSync])

  // 4. Supabase custom credentials updated
  useEffect(() => {
    const handleConfigChange = () => {
      if (user) triggerCloudSync(false)
    }
    window.addEventListener('quizmaster-supabase-config-changed', handleConfigChange)
    return () => window.removeEventListener('quizmaster-supabase-config-changed', handleConfigChange)
  }, [user, triggerCloudSync])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => getAllResults(user?.id), [user, resultsVersion])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overallBest = useMemo(() => getBestScore(null, user?.id), [user, resultsVersion])

  // Aggregate Metrics
  const analytics = useMemo(() => {
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        avgAccuracy: 0,
        avgScore: 0,
        bestScore: 0,
        categoryStats: {},
      }
    }

    const totalAttempts = results.length
    const totalQuestionsAnswered = results.reduce((acc, r) => acc + (r.total || 0), 0)
    const totalCorrect = results.reduce((acc, r) => acc + (r.correct || 0), 0)
    const avgScore = Math.round(
      results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalAttempts
    )
    const avgAccuracy = Math.round(
      results.reduce(
        (acc, r) => acc + (r.accuracy !== undefined ? r.accuracy : r.percentage || 0),
        0
      ) / totalAttempts
    )
    const bestScore = Math.max(...results.map((r) => r.percentage || 0))

    // Category breakdown
    const categoryStats = {}
    results.forEach((r) => {
      const cat = r.categoryName || 'General'
      if (!categoryStats[cat]) {
        categoryStats[cat] = { attempts: 0, totalScore: 0, totalCorrect: 0, totalQuestions: 0 }
      }
      categoryStats[cat].attempts += 1
      categoryStats[cat].totalScore += r.percentage || 0
      categoryStats[cat].totalCorrect += r.correct || 0
      categoryStats[cat].totalQuestions += r.total || 0
    })

    return {
      totalAttempts,
      totalQuestionsAnswered,
      totalCorrect,
      avgAccuracy,
      avgScore,
      bestScore,
      categoryStats,
    }
  }, [results])

  const rankTier = useMemo(() => {
    if (analytics.totalAttempts === 0) return { title: 'Apprentice', badge: '🌱', level: 'Novice' }
    if (analytics.avgScore >= 85 && analytics.totalAttempts >= 5)
      return { title: 'Grandmaster Scholar', badge: '👑', level: 'Master' }
    if (analytics.avgScore >= 70)
      return { title: 'Advanced Specialist', badge: '⚡', level: 'Senior' }
    if (analytics.avgScore >= 50)
      return { title: 'Skillful Challenger', badge: '🎯', level: 'Intermediate' }
    return { title: 'Dedicated Learner', badge: '📚', level: 'Junior' }
  }, [analytics])

  const handleLaunchCartQuiz = () => {
    if (studyCart.length === 0) return
    if (onStartCustomQuiz) {
      onStartCustomQuiz(studyCart)
    } else {
      navigate('/deck')
    }
  }


  return (
    <div className="qm-dashboard">
      <Breadcrumbs items={[{ label: 'Dashboard & Analytics' }]} />

      {/* Header Banner */}
      <header className="qm-dashboard__header">
        <div className="qm-dashboard__header-info">
          <div className="qm-dashboard__pill">
            <span className="pill-dot"></span>
            <span>{rankTier.badge} {rankTier.title} Level</span>
          </div>

          <h1 className="qm-dashboard__title">Scholar Performance Dashboard</h1>
          <p className="qm-dashboard__subtitle">
            Comprehensive real-time analytics, cloud-synced metrics, and targeted practice hub.
          </p>
        </div>

        <div className="qm-dashboard__header-actions">
          {user && (
            <button
              type="button"
              className="btn btn--secondary qm-btn-flex"
              onClick={() => triggerCloudSync(false)}
              disabled={isSyncing}
              title="Fetch and sync results with Supabase Cloud across all devices"
            >
              <RefreshCw className={isSyncing ? 'spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
          )}

          <Link to="/" className="btn btn--primary qm-btn-flex">
            <Brain />
            <span>Launch Quiz</span>
          </Link>
          <Link to="/deck" className="btn btn--secondary qm-btn-flex">
            <ShoppingBagIcon />
            <span>Study Cart ({studyCart.length})</span>
          </Link>
        </div>
      </header>

      {/* Top 4 KPI Cards */}
      <section className="qm-dashboard__kpis">
        <div className="qm-kpi-card">
          <div className="qm-kpi-card__icon qm-kpi-card__icon--blue">
            <Flame />
          </div>
          <div className="qm-kpi-card__content">
            <span className="qm-kpi-card__label">Total Quizzes</span>
            <span className="qm-kpi-card__value">{analytics.totalAttempts}</span>
            <span className="qm-kpi-card__sub">{analytics.totalQuestionsAnswered} Questions Solved</span>
          </div>
        </div>

        <div className="qm-kpi-card">
          <div className="qm-kpi-card__icon qm-kpi-card__icon--green">
            <Target />
          </div>
          <div className="qm-kpi-card__content">
            <span className="qm-kpi-card__label">Average Accuracy</span>
            <span className="qm-kpi-card__value">{analytics.avgAccuracy}%</span>
            <span className="qm-kpi-card__sub">{analytics.totalCorrect} Correct Answers</span>
          </div>
        </div>

        <div className="qm-kpi-card">
          <div className="qm-kpi-card__icon qm-kpi-card__icon--amber">
            <Trophy />
          </div>
          <div className="qm-kpi-card__content">
            <span className="qm-kpi-card__label">Personal Best</span>
            <span className="qm-kpi-card__value">{analytics.bestScore}%</span>
            <span className="qm-kpi-card__sub">
              {overallBest ? `${overallBest.categoryName}` : 'No attempts yet'}
            </span>
          </div>
        </div>

        <div className="qm-kpi-card">
          <div className="qm-kpi-card__icon qm-kpi-card__icon--purple">
            <ShoppingBagIcon />
          </div>
          <div className="qm-kpi-card__content">
            <span className="qm-kpi-card__label">Study Deck & Cart</span>
            <span className="qm-kpi-card__value">{studyCart.length}</span>
            <span className="qm-kpi-card__sub">{customQuestions.length} Custom Authored</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Category Mastery & Quick Launch Hub */}
      <div className="qm-dashboard__grid">
        {/* Category Proficiency Progress */}
        <section className="qm-dashboard-card qm-dashboard__mastery">
          <div className="qm-dashboard-card__header">
            <div>
              <h2 className="qm-dashboard-card__title">Category Mastery Breakdown</h2>
              <p className="qm-dashboard-card__subtitle">
                Accuracy score trends based on your cloud-synced quiz sessions
              </p>
            </div>
            <Link to="/history" className="qm-dashboard-card__link">
              View Logs <ArrowRight />
            </Link>
          </div>

          <div className="qm-mastery-list">
            {categories.map((cat) => {
              const catStat = analytics.categoryStats[cat.name]
              const avg = catStat ? Math.round(catStat.totalScore / catStat.attempts) : 0
              const attempts = catStat ? catStat.attempts : 0

              return (
                <div key={cat.id} className="qm-mastery-item">
                  <div className="qm-mastery-item__header">
                    <span className="qm-mastery-item__icon">{cat.icon}</span>
                    <span className="qm-mastery-item__name">{cat.name}</span>
                    <span className="qm-mastery-item__attempts">
                      {attempts > 0 ? `${attempts} attempts` : 'Not attempted'}
                    </span>
                    <span className="qm-mastery-item__score">{avg}%</span>
                  </div>
                  <div className="qm-mastery-bar-bg">
                    <div
                      className="qm-mastery-bar-fill"
                      style={{
                        width: `${avg}%`,
                        backgroundColor: cat.color || 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quick Launch & Study Cart Hub */}
        <div className="qm-dashboard__side-col">
          {/* Study Cart Quick Practice Card */}
          <div className="qm-dashboard-card qm-study-card-highlight">
            <div className="qm-study-card__badge">
              <ShoppingBagIcon />
              <span>Targeted Practice</span>
            </div>
            <h3 className="qm-study-card__title">Tricky Questions Study Cart</h3>
            <p className="qm-study-card__text">
              You currently have <strong>{studyCart.length}</strong> tricky question(s) saved in your
              cart. Test yourself on these specific questions to cement your mastery.
            </p>
            <div className="qm-study-card__actions">
              <button
                type="button"
                className="btn btn--primary qm-btn-flex"
                onClick={handleLaunchCartQuiz}
                disabled={studyCart.length === 0}
              >
                <Sparkles />
                <span>Practice Cart Questions</span>
              </button>
              <Link to="/deck" className="btn btn--outline qm-btn-flex">
                <span>Manage Cart & Decks</span>
              </Link>
            </div>
          </div>

          {/* Interactive Feature Hub */}
          <div className="qm-dashboard-card">
            <h3 className="qm-dashboard-card__title">Explore Special Modules</h3>
            <div className="qm-feature-list">
              <Link to="/deck" className="qm-feature-item">
                <div className="qm-feature-item__icon qm-feature-item__icon--teal">
                  <PlusCircleIcon />
                </div>
                <div className="qm-feature-item__info">
                  <span className="qm-feature-item__title">Custom Question Studio (CRUD)</span>
                  <span className="qm-feature-item__desc">
                    Author, edit, and organize your own custom question bank
                  </span>
                </div>
                <ArrowRight className="qm-feature-item__arrow" />
              </Link>


              <Link to="/" className="qm-feature-item">
                <div className="qm-feature-item__icon qm-feature-item__icon--indigo">
                  <GlobeIcon />
                </div>
                <div className="qm-feature-item__info">
                  <span className="qm-feature-item__title">Live Open Trivia API (Axios)</span>
                  <span className="qm-feature-item__desc">
                    Connect directly to third-party REST API for infinite live questions
                  </span>
                </div>
                <ArrowRight className="qm-feature-item__arrow" />
              </Link>

              <Link to="/history" className="qm-feature-item">
                <div className="qm-feature-item__icon qm-feature-item__icon--amber">
                  <Clock />
                </div>
                <div className="qm-feature-item__info">
                  <span className="qm-feature-item__title">Attempt Log & Records</span>
                  <span className="qm-feature-item__desc">
                    Filter, sort, search, and review your historical quizzes
                  </span>
                </div>
                <ArrowRight className="qm-feature-item__arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts Row */}
      <section className="qm-dashboard-card qm-dashboard__recent">
        <div className="qm-dashboard-card__header">
          <div>
            <h2 className="qm-dashboard-card__title">Recent Quiz Attempts</h2>
            <p className="qm-dashboard-card__subtitle">
              Your latest recorded performance sessions synced across devices
            </p>
          </div>
          <Link to="/history" className="qm-dashboard-card__link">
            See All History <ArrowRight />
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="qm-dashboard__empty">
            <p>No attempts recorded yet. Start your first challenge or sync with Supabase!</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <Link to="/" className="btn btn--primary">
                Start Challenge
              </Link>
              {user && (
                <button
                  type="button"
                  className="btn btn--secondary qm-btn-flex"
                  onClick={() => triggerCloudSync(false)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={isSyncing ? 'spin' : ''} />
                  <span>Fetch Cloud History</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="qm-recent-grid">
            {results.slice(0, 4).map((r, i) => (
              <div key={r.id || i} className="qm-recent-item">
                <div className="qm-recent-item__top">
                  <span className="qm-recent-item__cat">{r.categoryName}</span>
                  <div className="qm-recent-item__top-right">
                    {r.isSynced && (
                      <span className="qm-cloud-tag" title="Synced across devices via Supabase Cloud">
                        <CloudCheck className="qm-cloud-tag__icon" />
                        <span>Cloud</span>
                      </span>
                    )}
                    <span className="qm-recent-item__score-badge">{r.percentage}%</span>
                  </div>
                </div>
                <div className="qm-recent-item__meta">
                  <span>{r.correct}/{r.total} Correct</span>
                  <span>•</span>
                  <span>{formatTime(r.time)}</span>
                </div>
                <span className="qm-recent-item__date">
                  {new Date(r.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Supabase Configuration & SQL Schema Modal */}
      <SupabaseModal
        isOpen={showSqlModal}
        onClose={() => {
          setShowSqlModal(false)
          triggerCloudSync(true)
        }}
      />
    </div>
  )
}
