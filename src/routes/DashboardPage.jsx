import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { fetchAttemptStats } from '../services/attemptService.js'
import { formatTime } from '../utils/helpers.js'
import Button from '../components/ui/Button.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import {
  Trophy, Target, Star, Flame, TrendingUp,
  PlayCircle, Sparkles, ArrowRight, FileText
} from '../components/icons/ExtraIcons.jsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, loading, retry } = useFetch(fetchAttemptStats, [])

  if (loading) return <div className="dashboard"><Skeleton lines={4} /></div>

  if (!stats || stats.totalAttempts === 0) {
    return (
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!</h1>
          <p>You haven't taken any quizzes yet. Generate one from a document to get started.</p>
        </div>
        <div className="dashboard__empty">
          <FileText className="dashboard__empty-icon" />
          <h2>No attempts yet</h2>
          <p>Upload a document and generate your first AI quiz, or try a quick trivia quiz.</p>
          <div className="dashboard__empty-actions">
            <Link to="/generate"><Button variant="primary">Generate Quiz</Button></Link>
            <Link to="/"><Button variant="secondary">Quick Quiz</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  const chartData = stats.categoryPerformance.map((c) => ({
    name: c.category,
    score: c.avgScore,
  }))

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
        </div>
        <div className="dashboard__header-actions">
          <Link to="/generate"><Button variant="primary" size="sm"><Sparkles /> Generate Quiz</Button></Link>
          <Link to="/"><Button variant="secondary" size="sm"><PlayCircle /> Quick Quiz</Button></Link>
        </div>
      </div>

      <div className="dashboard__stats-grid">
        <div className="stat-card stat-card--amber">
          <Trophy className="stat-card__icon" />
          <div>
            <span className="stat-card__value">{stats.bestScore}%</span>
            <span className="stat-card__label">Personal Best</span>
          </div>
        </div>
        <div className="stat-card stat-card--cyan">
          <Target className="stat-card__icon" />
          <div>
            <span className="stat-card__value">{stats.bestAccuracy}%</span>
            <span className="stat-card__label">Best Accuracy</span>
          </div>
        </div>
        <div className="stat-card stat-card--indigo">
          <Star className="stat-card__icon" />
          <div>
            <span className="stat-card__value">{stats.averageScore}%</span>
            <span className="stat-card__label">Avg Score</span>
          </div>
        </div>
        <div className="stat-card stat-card--rose">
          <Flame className="stat-card__icon" />
          <div>
            <span className="stat-card__value">{stats.totalAttempts}</span>
            <span className="stat-card__label">Quizzes Taken</span>
          </div>
        </div>
      </div>

      <div className="dashboard__chart-section">
        <h2 className="dashboard__section-title">Category Performance</h2>
        {chartData.length > 0 ? (
          <div className="dashboard__chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="dashboard__no-chart">No category data yet.</p>
        )}
      </div>

      <div className="dashboard__recent">
        <div className="dashboard__recent-header">
          <h2 className="dashboard__section-title">Recent Attempts</h2>
          <Link to="/history" className="dashboard__recent-link">
            View All <ArrowRight />
          </Link>
        </div>
        {stats.recentAttempts.length > 0 ? (
          <div className="dashboard__recent-list">
            {stats.recentAttempts.map((r, i) => (
              <div key={r.id || i} className="recent-item">
                <div className="recent-item__left">
                  <span className="recent-item__cat">{r.category_name}</span>
                  <span className="recent-item__date">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="recent-item__score">{r.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard__no-recent">No recent activity.</p>
        )}
      </div>
    </div>
  )
}
