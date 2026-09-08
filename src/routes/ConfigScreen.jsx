import { useState, useMemo } from 'react'
import { categories, difficultyLevels, questionCounts } from '../data/questionBank.js'
import { ArrowRight, HistoryIcon, Trophy, Flame } from '../components/icons/Icons.jsx'
import { getAllResults, getBestScore } from '../utils/storage.js'

export default function ConfigScreen({ config, setConfig, onStart, onViewHistory }) {
  const [error, setError] = useState('')
  const results = useMemo(() => getAllResults(), [])
  const recentResults = results.slice(0, 3)
  const bestScore = useMemo(() => getBestScore(), [results])

  const handleStart = () => {
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
    onStart()
  }

  return (
    <div className="config-screen">
      <header className="config-header">
        <div className="config-header__main">
          <div className="config-header__pill">
            <span className="pill-dot"></span>
            <span>Interactive Knowledge Challenge</span>
          </div>
          <h1 className="config-header__title">QuizMaster</h1>
          <p className="config-header__subtitle">Customize your challenge parameters and test your knowledge</p>
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

      <div className="config-screen__layout">
        <div className="config-screen__main">
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
                  <span className="category-chip__title">Mixed</span>
                  <span className="category-chip__subtitle">All subjects combined</span>
                </div>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${config.category === cat.id ? 'category-chip--active' : ''}`}
                  style={config.category === cat.id ? { '--chip-color': cat.color, borderColor: cat.color } : {}}
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

          <button type="button" className="config-screen__start-btn" onClick={handleStart}>
            <span>Start Challenge</span>
            <ArrowRight className="config-screen__start-icon" />
          </button>
        </div>

        <aside className="config-screen__sidebar">
          {bestScore ? (
            <div className="config-sidebar-card pb-card" onClick={onViewHistory} title="View all attempt history">
              <div className="pb-card__header">
                <span className="pb-card__tag"><Flame /> Personal Best</span>
                <span className="pb-card__arrow">&rarr;</span>
              </div>
              <div className="pb-card__body">
                <div className="pb-card__score">{bestScore.percentage}%</div>
                <p className="pb-card__cat">{bestScore.categoryName}</p>
                <div className="pb-card__meta">
                  <span>{bestScore.correct}/{bestScore.total} Correct</span>
                  <span>•</span>
                  <span>{bestScore.accuracy !== undefined ? bestScore.accuracy : bestScore.percentage}% Accuracy</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="config-sidebar-card pb-card pb-card--empty">
              <div className="pb-card__header">
                <span className="pb-card__tag"><Trophy /> No Records Yet</span>
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
                        {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="recent-item__right">
                      <span className={`recent-item__score ${r.percentage >= 80 ? 'recent-item__score--high' : ''}`}>
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
              <li>⏱️ <strong>20s Per Question:</strong> Speed & accuracy both count.</li>
              <li>🚩 <strong>Flag Questions:</strong> Mark tricky questions and revisit them.</li>
              <li>🔁 <strong>Target Mistakes:</strong> Retry only the questions you missed.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

