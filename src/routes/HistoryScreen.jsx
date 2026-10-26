import { useState, useMemo, useEffect, useCallback } from 'react'
import { getAllResults, deleteResult, clearResults, getBestScore, syncResultsWithCloud } from '../utils/storage.js'
import { formatTime } from '../utils/helpers.js'
import { Trophy, Target, Flame, Trash2, ArrowLeft, Filter, ArrowUpDown, Star, RefreshCw } from '../components/icons/Icons.jsx'
import { categories } from '../data/questionBank.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Breadcrumbs from '../components/common/Breadcrumbs.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import Pagination from '../components/common/Pagination.jsx'
import Modal from '../components/common/Modal.jsx'

/**
 * Enhanced Attempt History & Records
 * Practical topics:
 * - Search, filter, sort patterns
 * - Debounce
 * - Pagination
 * - Modal dialogs
 * - Navigation layout and page structure
 */
export default function HistoryScreen({ onHome }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [results, setResults] = useState(() => getAllResults(user?.id))
  const [isSyncing, setIsSyncing] = useState(false)

  // Search, Filter, and Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest' | 'score_desc' | 'score_asc' | 'time_asc'

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // Modal State
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const handleSync = useCallback(async (isSilent = false) => {
    if (!user) return
    if (!isSilent) setIsSyncing(true)
    try {
      const res = await syncResultsWithCloud(user)
      if (res.success && !isSilent) {
        showToast(
          res.remoteCount > 0
            ? `Synced ${res.remoteCount} record(s) from Supabase Cloud!`
            : 'History is in sync with Supabase Cloud!',
          'success'
        )
      }
    } catch (err) {
      console.warn('History sync error:', err)
    } finally {
      if (!isSilent) setIsSyncing(false)
    }
  }, [user, showToast])

  useEffect(() => {
    if (user) {
      syncResultsWithCloud(user).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const handleUpdate = () => setResults(getAllResults(user?.id))
    window.addEventListener('quizmaster-results-updated', handleUpdate)
    return () => window.removeEventListener('quizmaster-results-updated', handleUpdate)
  }, [user])

  const stats = useMemo(() => {
    if (results.length === 0) {
      return { totalAttempts: 0, bestScore: 0, bestAccuracy: 0, averageScore: 0 }
    }
    const totalAttempts = results.length
    const bestScore = Math.max(...results.map((r) => r.percentage || 0))
    const bestAccuracy = Math.max(
      ...results.map((r) => (r.accuracy !== undefined ? r.accuracy : r.percentage || 0))
    )
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalAttempts
    )
    return { totalAttempts, bestScore, bestAccuracy, averageScore }
  }, [results])

  const categoryFilterOptions = useMemo(() => {
    const list = ['Mixed', ...categories.map((c) => c.name)]
    const seen = new Set(list)
    results.forEach((r) => {
      if (r.categoryName && !seen.has(r.categoryName)) {
        seen.add(r.categoryName)
        list.push(r.categoryName)
      }
    })
    return list
  }, [results])

  // Search, Filter, and Sort logic
  const filteredAndSortedResults = useMemo(() => {
    return results
      .filter((r) => {
        const matchesCategory =
          selectedCategory === 'all' || r.categoryName === selectedCategory
        const matchesSearch =
          !searchQuery.trim() ||
          r.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${r.percentage}%`.includes(searchQuery.trim())

        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        if (sortOrder === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        }
        if (sortOrder === 'score_desc') {
          return (b.percentage || 0) - (a.percentage || 0)
        }
        if (sortOrder === 'score_asc') {
          return (a.percentage || 0) - (b.percentage || 0)
        }
        if (sortOrder === 'time_asc') {
          return (a.time || 0) - (b.time || 0)
        }
        return 0
      })
  }, [results, selectedCategory, searchQuery, sortOrder])

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredAndSortedResults.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedResults, page, pageSize])

  const overallBest = useMemo(() => {
    return getBestScore(null, user?.id)
  }, [results, user])

  const handleDelete = (id) => {
    const updated = deleteResult(id, user?.id)
    setResults(updated)
    setDeleteTargetId(null)
    showToast('Record deleted successfully', 'info')
  }

  const handleClearAll = () => {
    clearResults(user?.id)
    setResults([])
    setClearConfirmOpen(false)
    showToast('All attempt history cleared', 'info')
  }

  return (
    <div className="history-screen">
      <Breadcrumbs items={[{ label: 'Attempt History & Records' }]} />

      <div className="history-screen__header">
        <button className="history-screen__back-btn" onClick={onHome}>
          <ArrowLeft /> Home
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 className="history-screen__title">Attempt History & Records</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {user ? (
              <>
                Account records for <strong>{user.user_metadata?.full_name || user.email}</strong>
              </>
            ) : (
              <>Showing guest session attempts</>
            )}
          </span>
        </div>
        {user && (
          <button
            type="button"
            className="btn btn--secondary btn--sm qm-btn-flex"
            style={{ marginLeft: 'auto' }}
            onClick={() => handleSync(false)}
            disabled={isSyncing}
            title="Fetch and sync results with Supabase across all devices"
          >
            <RefreshCw className={isSyncing ? 'spin' : ''} style={{ width: '13px', height: '13px' }} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>
        )}
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
              {overallBest.categoryName} • {overallBest.correct}/{overallBest.total} Correct •{' '}
              {formatTime(overallBest.time)}
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
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

      {/* Search, Filter, and Sort Controls */}
      <div className="history-screen__controls-bar">
        <SearchInput
          placeholder="Search records by category name..."
          onDebouncedChange={(val) => {
            setSearchQuery(val)
            setPage(1)
          }}
          className="history-search-input"
        />

        <div className="history-screen__filter-group">
          <div className="history-screen__filter">
            <Filter className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="history-screen__select"
            >
              <option value="all">All Categories</option>
              {categoryFilterOptions.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          <div className="history-screen__filter">
            <ArrowUpDown className="filter-icon" />
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value)
                setPage(1)
              }}
              className="history-screen__select"
              aria-label="Sort attempt history"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="score_desc">Sort: Highest Score</option>
              <option value="score_asc">Sort: Lowest Score</option>
              <option value="time_asc">Sort: Fastest Time</option>
            </select>
          </div>

          {results.length > 0 && (
            <button
              className="history-screen__clear-btn"
              onClick={() => setClearConfirmOpen(true)}
            >
              <Trash2 /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      {filteredAndSortedResults.length === 0 ? (
        <div className="history-screen__empty">
          <p>
            {results.length === 0
              ? 'No attempt records found. Take your first quiz to begin logging your achievements!'
              : 'No attempts match your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <>
          <div className="history-screen__list">
            {paginatedResults.map((r, i) => {
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
                      <span>
                        {r.correct}/{r.total} Correct
                      </span>
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
                      onClick={() => setDeleteTargetId(r.id)}
                      title="Delete record"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Numbered Pagination */}
          <Pagination
            currentPage={page}
            totalItems={filteredAndSortedResults.length}
            pageSize={pageSize}
            onPageChange={(newPage) => {
              setPage(newPage)
              window.scrollTo({ top: 350, behavior: 'smooth' })
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </>
      )}

      {/* Delete Record Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Attempt Record"
        maxWidth="sm"
        footer={
          <div className="qm-modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => handleDelete(deleteTargetId)}
            >
              Delete
            </button>
          </div>
        }
      >
        <p>Are you sure you want to permanently delete this attempt record from your history?</p>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Clear All Attempt History"
        maxWidth="sm"
        footer={
          <div className="qm-modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setClearConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to erase all your past quiz attempt records? This action cannot be
          reversed.
        </p>
      </Modal>
    </div>
  )
}
