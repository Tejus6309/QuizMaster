import { useState, useMemo } from 'react'
import { getAllResults, deleteResult, clearResults, getQuizStats, getBestScore } from '../utils/storage.js'
import { formatTime } from '../utils/helpers.js'
import { Trophy, Target, Flame, Trash2, Home, ArrowLeft, Filter, Star } from '../components/icons/Icons.jsx'
import { categories } from '../data/questionBank.js'

export default function HistoryScreen({ onHome }) {
  const [results, setResults] = useState(() => getAllResults())
  const [selectedCategory, setSelectedCategory] = useState('all')

  const stats = useMemo(() => {
    if (results.length === 0) {
      return { totalAttempts: 0, bestScore: 0, bestAccuracy: 0, averageScore: 0 }
    }
    const totalAttempts = results.length
    const bestScore = Math.max(...results.map((r) => r.percentage || 0))
    const bestAccuracy = Math.max(...results.map((r) => r.accuracy !== undefined ? r.accuracy : r.percentage || 0))
    const averageScore = Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalAttempts)
    return { totalAttempts, bestScore, bestAccuracy, averageScore }
  }, [results])

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return results
    return results.filter((r) => r.categoryName === selectedCategory)
  }, [results, selectedCategory])

  const overallBest = useMemo(() => {
    return getBestScore()
  }, [results])

  const handleDelete = (id) => {
    const updated = deleteResult(id)
    setResults(updated)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all attempt history?')) {
      clearResults()
      setResults([])
    }
  }

  return (
    <div className="history-screen">
      <div className="history-screen__header">
        <button className="history-screen__back-btn" onClick={onHome}>
          <ArrowLeft /> Home
        </button>
        <h1 className="history-screen__title">Attempt History & Records</h1>
      </div>

      {overallBest && (
        <div className="history-screen__pb-card">
          <div className="history-screen__pb-icon-box">
            <Trophy className="history-screen__pb-trophy" />
          </div>
          <div className="history-screen__pb-info">
            <span className="history-screen__pb-tag">OVERALL PERSONAL BEST</span>
            <h3 className="history-screen__pb-score">{overallBest.percentage}% Score</h3>
            <p className="history-screen__pb-sub">
              {overallBest.categoryName} • {overallBest.correct}/{overallBest.total} Correct • {formatTime(overallBest.time)}
            </p>
          </div>
        </div>
      )}

      <div className="history-screen__stats-grid">
        <div className="history-stat-card">
          <Trophy className="history-stat-icon history-stat-icon--amber" />
          <div className="history-stat-data">
            <span className="history-stat-val">{stats.bestScore}%</span>
            <span className="history-stat-lbl">Personal Best</span>
          </div>
        </div>

        <div className="history-stat-card">
          <Target className="history-stat-icon history-stat-icon--cyan" />
          <div className="history-stat-data">
            <span className="history-stat-val">{stats.bestAccuracy}%</span>
            <span className="history-stat-lbl">Best Accuracy</span>
          </div>
        </div>

        <div className="history-stat-card">
          <Star className="history-stat-icon history-stat-icon--indigo" />
          <div className="history-stat-data">
            <span className="history-stat-val">{stats.averageScore}%</span>
            <span className="history-stat-lbl">Avg Score</span>
          </div>
        </div>

        <div className="history-stat-card">
          <Flame className="history-stat-icon history-stat-icon--rose" />
          <div className="history-stat-data">
            <span className="history-stat-val">{stats.totalAttempts}</span>
            <span className="history-stat-lbl">Quizzes Taken</span>
          </div>
        </div>
      </div>

      <div className="history-screen__controls">
        <div className="history-screen__filter">
          <Filter className="filter-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="history-screen__select"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {results.length > 0 && (
          <button className="history-screen__clear-btn" onClick={handleClearAll}>
            <Trash2 /> Clear History
          </button>
        )}
      </div>

      {filteredResults.length === 0 ? (
        <div className="history-screen__empty">
          <p>No attempt records found.</p>
        </div>
      ) : (
        <div className="history-screen__list">
          {filteredResults.map((r, i) => {
            const formattedDate = new Date(r.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={r.id || i} className="history-card">
                <div className="history-card__left">
                  <div className="history-card__badge-row">
                    <span className="history-card__category">{r.categoryName}</span>
                    {r.isPersonalBest && (
                      <span className="history-card__pb-tag">
                        <Flame /> Personal Best
                      </span>
                    )}
                  </div>
                  <div className="history-card__meta">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{r.correct}/{r.total} Correct</span>
                    <span>•</span>
                    <span>{formatTime(r.time)}</span>
                  </div>
                </div>

                <div className="history-card__right">
                  <div className="history-card__score-box">
                    <span className="history-card__score-val">{r.percentage}%</span>
                    <span className="history-card__accuracy-val">
                      {r.accuracy !== undefined ? r.accuracy : r.percentage}% acc
                    </span>
                  </div>

                  <button
                    className="history-card__del-btn"
                    onClick={() => handleDelete(r.id)}
                    title="Delete record"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
