import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getAllResults, getBestScore } from '../utils/storage.js'
import { formatTime } from '../utils/helpers.js'
import {
  User,
  Mail,
  Trophy,
  Target,
  Flame,
  Clock,
  Sparkles,
  LogOut,
  ArrowLeft,
  SupabaseIcon,
  CheckCircle2,
  Settings,
} from '../components/icons/Icons.jsx'

export default function ProfileScreen() {
  const { user, isDemo, isConfigured, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [resultsVersion, setResultsVersion] = useState(0)

  useEffect(() => {
    const handleUpdate = () => setResultsVersion((v) => v + 1)
    window.addEventListener('quizmaster-results-updated', handleUpdate)
    return () => window.removeEventListener('quizmaster-results-updated', handleUpdate)
  }, [])

  const results = useMemo(() => getAllResults(user?.id), [user, resultsVersion])
  const bestScore = useMemo(() => getBestScore(null, user?.id), [user, resultsVersion])

  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        totalQuizzes: 0,
        avgPercentage: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        bestPercentage: 0,
      }
    }

    const totalQuizzes = results.length
    const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0)
    const avgPercentage = Math.round(totalPercentage / totalQuizzes)
    const totalQuestions = results.reduce((sum, r) => sum + (r.total || 0), 0)
    const totalCorrect = results.reduce((sum, r) => sum + (r.correct || 0), 0)
    const bestPercentage = Math.max(...results.map((r) => r.percentage || 0))

    return {
      totalQuizzes,
      avgPercentage,
      totalQuestions,
      totalCorrect,
      bestPercentage,
    }
  }, [results])

  if (!user) {
    return (
      <div className="profile-screen-empty">
        <div className="profile-empty-card">
          <div className="profile-empty-icon">
            <User />
          </div>
          <h2>Authentication Required</h2>
          <p>Please log in or create an account to view your profile and synchronized stats.</p>
          <div className="profile-empty-actions">
            <Link to="/login" className="btn btn--primary">
              Log In
            </Link>
            <Link to="/signup" className="btn btn--secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSaveName = async () => {
    if (!nameInput.trim()) return
    await updateProfile({ fullName: nameInput.trim() })
    setEditingName(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Quizzer'
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="profile-page">
      {/* Header bar */}
      <div className="profile-header">
        <button
          type="button"
          className="btn btn--ghost profile-back-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeft />
          <span>Back to Challenge</span>
        </button>
        <h1 className="profile-title">Player Profile & Statistics</h1>
      </div>

      <div className="profile-grid">
        {/* Left Column: User Card & Account Info */}
        <div className="profile-card profile-card--user">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-circle">{initials}</div>
            <div className="profile-avatar-badge">
              <Sparkles className="profile-badge-icon" />
            </div>
          </div>

          <div className="profile-user-details">
            {editingName ? (
              <div className="profile-name-edit">
                <input
                  type="text"
                  className="profile-name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={handleSaveName}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditingName(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-name-display">
                <h2 className="profile-name">{displayName}</h2>
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => setEditingName(true)}
                  title="Edit display name"
                >
                  Edit
                </button>
              </div>
            )}

            {saveSuccess && (
              <div className="profile-save-tag">
                <CheckCircle2 /> Profile updated!
              </div>
            )}

            <p className="profile-email">
              <Mail className="micro-icon" />
              <span>{user.email}</span>
            </p>

            <div className="profile-account-type">
              <span className="auth-type-pill auth-type-pill--supabase">
                <span>Verified Scholar</span>
              </span>
            </div>
          </div>

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <span className="profile-meta-label">Member Since</span>
              <span className="profile-meta-val">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent'}
              </span>
            </div>

            <div className="profile-meta-item">
              <span className="profile-meta-label">User ID</span>
              <span className="profile-meta-val profile-meta-val--code">
                {user.id ? user.id.slice(0, 12) + '...' : 'local'}
              </span>
            </div>

            <div className="profile-meta-item">
              <span className="profile-meta-label">Account Status</span>
              <span className="profile-meta-val">
                🟢 Active
              </span>
            </div>
          </div>

          <div className="profile-user-actions">

            <button
              type="button"
              className="btn btn--outline-danger profile-btn-full"
              onClick={handleSignOut}
            >
              <LogOut />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Performance Stats & Recent Quizzes */}
        <div className="profile-content">
          {/* Key Stat Badges */}
          <div className="profile-stats-grid">
            <div className="profile-stat-card profile-stat-card--blue">
              <div className="profile-stat-icon-wrap">
                <Trophy />
              </div>
              <div className="profile-stat-text">
                <span className="profile-stat-num">{stats.bestPercentage}%</span>
                <span className="profile-stat-title">Personal Best</span>
              </div>
            </div>

            <div className="profile-stat-card profile-stat-card--green">
              <div className="profile-stat-icon-wrap">
                <Target />
              </div>
              <div className="profile-stat-text">
                <span className="profile-stat-num">{stats.avgPercentage}%</span>
                <span className="profile-stat-title">Average Score</span>
              </div>
            </div>

            <div className="profile-stat-card profile-stat-card--amber">
              <div className="profile-stat-icon-wrap">
                <Flame />
              </div>
              <div className="profile-stat-text">
                <span className="profile-stat-num">{stats.totalQuizzes}</span>
                <span className="profile-stat-title">Quizzes Completed</span>
              </div>
            </div>

            <div className="profile-stat-card profile-stat-card--purple">
              <div className="profile-stat-icon-wrap">
                <Clock />
              </div>
              <div className="profile-stat-text">
                <span className="profile-stat-num">{stats.totalCorrect}</span>
                <span className="profile-stat-title">Questions Mastered</span>
              </div>
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h3 className="profile-section-title">Recent Quiz Activity</h3>
              <Link to="/history" className="profile-view-all-link">
                View Full History &rarr;
              </Link>
            </div>

            {results.length === 0 ? (
              <div className="profile-empty-history">
                <p>No quiz attempts recorded yet.</p>
                <Link to="/" className="btn btn--primary btn--sm">
                  Start Your First Quiz
                </Link>
              </div>
            ) : (
              <div className="profile-history-list">
                {results.slice(0, 4).map((r, i) => (
                  <div key={r.id || i} className="profile-history-item">
                    <div className="profile-history-item__left">
                      <div
                        className={`profile-history-score-badge ${
                          r.percentage >= 80
                            ? 'badge-high'
                            : r.percentage >= 50
                            ? 'badge-mid'
                            : 'badge-low'
                        }`}
                      >
                        {r.percentage}%
                      </div>
                      <div className="profile-history-details">
                        <span className="profile-history-category">
                          {r.categoryName || 'Mixed'}
                        </span>
                        <span className="profile-history-meta">
                          {r.difficulty || 'Normal'} &bull; {r.correct}/{r.total} correct &bull;{' '}
                          {formatTime(r.time || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="profile-history-item__right">
                      {r.isPersonalBest && (
                        <span className="profile-pb-tag">
                          <Trophy className="pb-icon" /> PB
                        </span>
                      )}
                      <span className="profile-history-date">
                        {r.date
                          ? new Date(r.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
