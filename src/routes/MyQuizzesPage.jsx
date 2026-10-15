import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuizzes, deleteQuizDB, updateQuizDB } from '../services/quizService.js'
import { useQuizStore } from '../store/useQuizStore.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useToast } from '../context/ToastContext.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { Search, Trash2, Edit, PlayCircle, FileText, ChevronDown } from '../components/icons/ExtraIcons.jsx'

const PAGE_SIZE = 10

export default function MyQuizzesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const loadQuizzes = useCallback(async (pageNum = 1, replace = false) => {
    setLoading(true)
    try {
      const { data, hasMore: more } = await fetchQuizzes(pageNum, PAGE_SIZE, {
        search: debouncedSearch,
        difficulty: difficultyFilter,
      })
      setQuizzes((prev) => (replace ? data : [...prev, ...data]))
      setHasMore(more)
      setPage(pageNum)
    } catch (err) {
      toast('Could not load quizzes', 'error')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, difficultyFilter, toast])

  useEffect(() => {
    loadQuizzes(1, true)
  }, [loadQuizzes])

  const handleStartQuiz = (quiz) => {
    const questions = quiz.questions.map((q, i) => ({
      ...q,
      id: q.id || `quiz_${i}`,
      options: q.options?.[0]?.isCorrect !== undefined
        ? q.options
        : q.options.map((opt, oi) => ({ opt, isCorrect: oi === q.correctIndex })),
    }))
    startQuiz(questions, {
      source: quiz.source || 'document',
      quizId: quiz.id,
      category: quiz.title || 'Saved Quiz',
      difficulty: quiz.difficulty,
    })
    navigate('/quiz')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteQuizDB(deleteTarget.id)
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id))
      toast('Quiz deleted', 'success')
    } catch {
      toast('Could not delete quiz', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleEditSave = async () => {
    if (!editTarget || !editTitle.trim()) return
    try {
      await updateQuizDB(editTarget.id, { title: editTitle.trim() })
      setQuizzes((prev) =>
        prev.map((q) => (q.id === editTarget.id ? { ...q, title: editTitle.trim() } : q))
      )
      toast('Quiz renamed', 'success')
    } catch {
      toast('Could not update quiz', 'error')
    } finally {
      setEditTarget(null)
    }
  }

  return (
    <div className="my-quizzes-page">
      <div className="my-quizzes-header">
        <h1>My Quizzes</h1>
        <div className="my-quizzes-controls">
          <div className="search-box">
            <Search className="search-box__icon" />
            <input
              type="text"
              className="search-box__input"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {loading && quizzes.length === 0 ? (
        <div className="my-quizzes-loading"><Spinner size="lg" /></div>
      ) : quizzes.length === 0 ? (
        <div className="my-quizzes-empty">
          <FileText className="my-quizzes-empty__icon" />
          <h2>No quizzes yet</h2>
          <p>Generate a quiz from a document to see it here.</p>
          <Button variant="primary" onClick={() => navigate('/generate')}>Generate Quiz</Button>
        </div>
      ) : (
        <>
          <div className="quiz-list">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-list-item">
                <div className="quiz-list-item__main">
                  <div className="quiz-list-item__icon">
                    <FileText />
                  </div>
                  <div className="quiz-list-item__info">
                    <h3 className="quiz-list-item__title">{quiz.title}</h3>
                    <div className="quiz-list-item__meta">
                      <span className="quiz-list-item__badge">{quiz.num_questions} Q</span>
                      <span className="quiz-list-item__badge">{quiz.difficulty}</span>
                      <span className="quiz-list-item__badge">{quiz.source}</span>
                      <span>{new Date(quiz.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="quiz-list-item__actions">
                  <button type="button" className="btn-icon-text" onClick={() => handleStartQuiz(quiz)} title="Take quiz">
                    <PlayCircle /> Take
                  </button>
                  <button type="button" className="btn-icon-text" onClick={() => { setEditTarget(quiz); setEditTitle(quiz.title) }} title="Rename">
                    <Edit />
                  </button>
                  <button type="button" className="btn-icon-text btn-icon-text--danger" onClick={() => setDeleteTarget(quiz)} title="Delete">
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && !loading && (
            <div className="my-quizzes-load-more">
              <Button variant="secondary" onClick={() => loadQuizzes(page + 1)}>Load More</Button>
            </div>
          )}
          {loading && quizzes.length > 0 && (
            <div className="my-quizzes-loading-more"><Spinner /></div>
          )}
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quiz?">
        <p className="modal-text">Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" className="btn--danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Rename Quiz">
        <Input
          label="Quiz Title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Enter quiz title"
        />
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSave}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
