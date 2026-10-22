import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/useQuizStore.js'
import { useToast } from '../context/ToastContext.jsx'
import { questionBank, categories, difficultyLevels } from '../data/questionBank.js'
import Breadcrumbs from '../components/common/Breadcrumbs.jsx'
import Tabs from '../components/common/Tabs.jsx'
import Modal from '../components/common/Modal.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import TextInput from '../components/common/TextInput.jsx'
import SelectField from '../components/common/SelectField.jsx'
import TextareaField from '../components/common/TextareaField.jsx'
import {
  Sparkles,
  Trash2,
  Brain,
  Filter,
  ArrowUpDown,
  CheckCircle2,
} from '../components/icons/Icons.jsx'

function ShoppingBagIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function EditIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function PlusIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CompassIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

const emptyQuestionForm = {
  question: '',
  category: 'general',
  difficulty: 'medium',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correctOptionIndex: 0,
  explanation: '',
}

export default function StudyDeckScreen({ onStartCustomQuiz }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    studyCart,
    removeFromCart,
    clearCart,
    addToCart,
    isInCart,
    customQuestions,
    addCustomQuestion,
    updateCustomQuestion,
    deleteCustomQuestion,
  } = useQuizStore()

  // Tab State
  const [activeTab, setActiveTab] = useState('cart') // 'cart' | 'crud' | 'explorer'

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [clearCartConfirm, setClearCartConfirm] = useState(false)

  // Form State & Validation
  const [formData, setFormData] = useState(emptyQuestionForm)
  const [formErrors, setFormErrors] = useState({})
  const [formTouched, setFormTouched] = useState({})

  // Explorer & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const tabs = [
    {
      id: 'cart',
      label: 'Study Cart',
      icon: ShoppingBagIcon,
      count: studyCart.length,
    },
    {
      id: 'crud',
      label: 'Custom Question Studio',
      icon: PlusIcon,
      count: customQuestions.length,
    },
    {
      id: 'explorer',
      label: 'Question Bank Explorer',
      icon: CompassIcon,
      count: questionBank.length,
    },
  ]

  // Form Validation Logic
  const validateForm = (data) => {
    const errors = {}
    if (!data.question.trim()) {
      errors.question = 'Question prompt is required'
    } else if (data.question.trim().length < 8) {
      errors.question = 'Question prompt must be at least 8 characters'
    }

    if (!data.category) errors.category = 'Category is required'
    if (!data.difficulty) errors.difficulty = 'Difficulty is required'

    if (!data.option1.trim()) errors.option1 = 'Option 1 is required'
    if (!data.option2.trim()) errors.option2 = 'Option 2 is required'
    if (!data.option3.trim()) errors.option3 = 'Option 3 is required'
    if (!data.option4.trim()) errors.option4 = 'Option 4 is required'

    // Check for duplicate options
    const options = [data.option1, data.option2, data.option3, data.option4].map((o) =>
      o.trim().toLowerCase()
    )
    const uniqueOptions = new Set(options.filter(Boolean))
    if (uniqueOptions.size < 4 && !errors.option1 && !errors.option2 && !errors.option3 && !errors.option4) {
      errors.option4 = 'All 4 options must be unique'
    }

    if (!data.explanation.trim()) {
      errors.explanation = 'Please provide an explanatory note for learners'
    }

    return errors
  }

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (formTouched[field]) {
        setFormErrors(validateForm(updated))
      }
      return updated
    })
  }

  const handleBlur = (field) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }))
    setFormErrors(validateForm(formData))
  }

  const handleOpenCreateModal = () => {
    setEditingQuestion(null)
    setFormData(emptyQuestionForm)
    setFormErrors({})
    setFormTouched({})
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q)
    setFormData({
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      option1: q.options[0]?.opt || '',
      option2: q.options[1]?.opt || '',
      option3: q.options[2]?.opt || '',
      option4: q.options[3]?.opt || '',
      correctOptionIndex: q.options.findIndex((o) => o.isCorrect) >= 0 ? q.options.findIndex((o) => o.isCorrect) : 0,
      explanation: q.explanation || '',
    })
    setFormErrors({})
    setFormTouched({})
    setIsCreateModalOpen(true)
  }

  const handleSaveQuestion = (e) => {
    e.preventDefault()
    const allTouched = Object.keys(emptyQuestionForm).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    setFormTouched(allTouched)

    const errors = validateForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      showToast('Please correct the validation errors in the form', 'error')
      return
    }

    const rawOptions = [
      { opt: formData.option1.trim(), isCorrect: formData.correctOptionIndex === 0 },
      { opt: formData.option2.trim(), isCorrect: formData.correctOptionIndex === 1 },
      { opt: formData.option3.trim(), isCorrect: formData.correctOptionIndex === 2 },
      { opt: formData.option4.trim(), isCorrect: formData.correctOptionIndex === 3 },
    ]

    const questionPayload = {
      question: formData.question.trim(),
      category: formData.category,
      difficulty: formData.difficulty,
      options: rawOptions,
      explanation: formData.explanation.trim(),
      isCustom: true,
    }

    if (editingQuestion) {
      updateCustomQuestion(editingQuestion.id, questionPayload)
      showToast('Question updated successfully!', 'success')
    } else {
      addCustomQuestion(questionPayload)
      showToast('New question created and added to your bank!', 'success')
    }

    setIsCreateModalOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteCustomQuestion(deleteConfirmId)
      showToast('Question deleted from custom bank', 'info')
      setDeleteConfirmId(null)
    }
  }

  const handleLaunchQuizWithQuestions = (questionsList, title = 'Custom Practice') => {
    if (!questionsList || questionsList.length === 0) {
      showToast('No questions available to start quiz', 'warning')
      return
    }

    if (onStartCustomQuiz) {
      onStartCustomQuiz(questionsList, title)
    } else {
      navigate('/quiz')
    }
  }

  // Question Explorer Filter & Search Logic
  const filteredExplorerQuestions = useMemo(() => {
    return questionBank
      .filter((q) => {
        const matchesCategory =
          selectedCategory === 'all' || q.category === selectedCategory
        const matchesDifficulty =
          selectedDifficulty === 'all' || q.difficulty === selectedDifficulty
        const matchesSearch =
          !searchQuery.trim() ||
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.explanation?.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesCategory && matchesDifficulty && matchesSearch
      })
      .sort((a, b) => {
        if (sortOrder === 'alpha') return a.question.localeCompare(b.question)
        if (sortOrder === 'difficulty') {
          const diffWeight = { easy: 1, medium: 2, hard: 3 }
          return (diffWeight[a.difficulty] || 2) - (diffWeight[b.difficulty] || 2)
        }
        return 0
      })
  }, [searchQuery, selectedCategory, selectedDifficulty, sortOrder])

  // Paginated slice for Explorer
  const paginatedQuestions = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredExplorerQuestions.slice(startIndex, startIndex + pageSize)
  }, [filteredExplorerQuestions, page, pageSize])

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    ...difficultyLevels.map((d) => ({ value: d.id, label: d.name })),
  ]

  return (
    <div className="qm-study-deck">
      <Breadcrumbs items={[{ label: 'Study Deck & Question Studio' }]} />

      <header className="qm-study-deck__header">
        <div>
          <div className="qm-study-deck__pill">
            <span className="pill-dot"></span>
            <span>Study Cart & Authoring Hub</span>
          </div>
          <h1 className="qm-study-deck__title">Study Deck & Question Studio</h1>
          <p className="qm-study-deck__subtitle">
            Manage your saved tricky question cart, author custom questions via full CRUD workflows,
            and explore the question bank.
          </p>
        </div>

        <div className="qm-study-deck__header-actions">
          {activeTab === 'cart' && studyCart.length > 0 && (
            <button
              type="button"
              className="btn btn--primary qm-btn-flex"
              onClick={() => handleLaunchQuizWithQuestions(studyCart, 'Study Cart')}
            >
              <Sparkles />
              <span>Practice Cart ({studyCart.length})</span>
            </button>
          )}

          {activeTab === 'crud' && (
            <button
              type="button"
              className="btn btn--primary qm-btn-flex"
              onClick={handleOpenCreateModal}
            >
              <PlusIcon />
              <span>Author New Question</span>
            </button>
          )}
        </div>
      </header>

      {/* Modern Animated Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ================= TAB 1: STUDY CART ================= */}
      {activeTab === 'cart' && (
        <section className="qm-tab-content">
          <div className="qm-cart-summary-bar">
            <div>
              <h2 className="qm-section-title">Saved Questions in Study Cart</h2>
              <p className="qm-section-subtitle">
                {studyCart.length === 0
                  ? 'Your cart is empty. Bookmark tricky questions during quizzes or explore the bank to add them here.'
                  : `You have ${studyCart.length} question(s) saved for targeted review.`}
              </p>
            </div>

            {studyCart.length > 0 && (
              <div className="qm-cart-actions">
                <button
                  type="button"
                  className="btn btn--outline qm-btn-danger-outline"
                  onClick={() => setClearCartConfirm(true)}
                >
                  <Trash2 />
                  <span>Empty Cart</span>
                </button>
                <button
                  type="button"
                  className="btn btn--primary qm-btn-flex"
                  onClick={() => handleLaunchQuizWithQuestions(studyCart, 'Study Cart Practice')}
                >
                  <Brain />
                  <span>Start Practice Session</span>
                </button>
              </div>
            )}
          </div>

          {studyCart.length === 0 ? (
            <div className="qm-empty-cart-card">
              <div className="qm-empty-cart-icon">
                <ShoppingBagIcon />
              </div>
              <h3>Your Study Cart is Empty</h3>
              <p>
                Add questions here to build a personalized study session targeting your weak spots.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setActiveTab('explorer')}
              >
                Explore Question Bank
              </button>
            </div>
          ) : (
            <div className="qm-cards-grid">
              {studyCart.map((q, idx) => (
                <div key={q.id || idx} className="qm-deck-card">
                  <div className="qm-deck-card__header">
                    <span className="qm-deck-card__cat-badge">{q.category}</span>
                    <span className={`qm-badge qm-badge--${q.difficulty}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <h3 className="qm-deck-card__question">{q.question}</h3>

                  <div className="qm-deck-card__options">
                    {q.options?.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`qm-deck-card__option ${opt.isCorrect ? 'qm-deck-card__option--correct' : ''}`}
                      >
                        <span className="qm-deck-card__opt-letter">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="qm-deck-card__opt-text">{opt.opt}</span>
                        {opt.isCorrect && (
                          <CheckCircle2 className="qm-deck-card__check-icon" />
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="qm-deck-card__explanation">
                      💡 <strong>Note:</strong> {q.explanation}
                    </p>
                  )}

                  <div className="qm-deck-card__footer">
                    <button
                      type="button"
                      className="qm-deck-card__remove-btn"
                      onClick={() => {
                        removeFromCart(q.id)
                        showToast('Removed question from Study Cart', 'info')
                      }}
                    >
                      <Trash2 />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 2: CUSTOM QUESTIONS STUDIO (CRUD) ================= */}
      {activeTab === 'crud' && (
        <section className="qm-tab-content">
          <div className="qm-cart-summary-bar">
            <div>
              <h2 className="qm-section-title">Custom Authored Questions (CRUD)</h2>
              <p className="qm-section-subtitle">
                Create, read, edit, and delete your own quiz questions. Test yourself on custom knowledge decks.
              </p>
            </div>

            <div className="qm-cart-actions">
              {customQuestions.length > 0 && (
                <button
                  type="button"
                  className="btn btn--secondary qm-btn-flex"
                  onClick={() => handleLaunchQuizWithQuestions(customQuestions, 'My Custom Deck')}
                >
                  <Brain />
                  <span>Play Custom Deck ({customQuestions.length})</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary qm-btn-flex"
                onClick={handleOpenCreateModal}
              >
                <PlusIcon />
                <span>New Question</span>
              </button>
            </div>
          </div>

          {customQuestions.length === 0 ? (
            <div className="qm-empty-cart-card">
              <div className="qm-empty-cart-icon">
                <PlusIcon />
              </div>
              <h3>No Custom Questions Yet</h3>
              <p>
                Take full control of your quizzes! Author your own custom questions, set answers, and play them anytime.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleOpenCreateModal}
              >
                Create First Question
              </button>
            </div>
          ) : (
            <div className="qm-cards-grid">
              {customQuestions.map((q, idx) => (
                <div key={q.id || idx} className="qm-deck-card">
                  <div className="qm-deck-card__header">
                    <span className="qm-deck-card__cat-badge">{q.category}</span>
                    <span className={`qm-badge qm-badge--${q.difficulty}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <h3 className="qm-deck-card__question">{q.question}</h3>

                  <div className="qm-deck-card__options">
                    {q.options?.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`qm-deck-card__option ${opt.isCorrect ? 'qm-deck-card__option--correct' : ''}`}
                      >
                        <span className="qm-deck-card__opt-letter">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="qm-deck-card__opt-text">{opt.opt}</span>
                        {opt.isCorrect && (
                          <CheckCircle2 className="qm-deck-card__check-icon" />
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="qm-deck-card__explanation">
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}

                  <div className="qm-deck-card__footer">
                    <button
                      type="button"
                      className="qm-deck-card__edit-btn"
                      onClick={() => handleOpenEditModal(q)}
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="qm-deck-card__remove-btn"
                      onClick={() => setDeleteConfirmId(q.id)}
                    >
                      <Trash2 />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 3: QUESTION BANK EXPLORER ================= */}
      {activeTab === 'explorer' && (
        <section className="qm-tab-content">
          <div className="qm-cart-summary-bar">
            <div>
              <h2 className="qm-section-title">Question Bank Explorer</h2>
              <p className="qm-section-subtitle">
                Browse through all curated questions with search, multi-faceted filtering, and pagination.
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="qm-explorer-toolbar">
            <SearchInput
              placeholder="Search question text or explanations (debounced)..."
              onDebouncedChange={(val) => {
                setSearchQuery(val)
                setPage(1)
              }}
              className="qm-explorer-search"
            />

            <div className="qm-explorer-filters">
              <div className="qm-select-filter-group" title="Filter by subject category">
                <Filter className="qm-filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                  }}
                  className="qm-select-styled"
                  aria-label="Filter by subject category"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="qm-select-filter-group" title="Filter by difficulty level">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value)
                    setPage(1)
                  }}
                  className="qm-select-styled"
                  aria-label="Filter by difficulty level"
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="qm-select-filter-group" title="Sort order">
                <ArrowUpDown className="qm-filter-icon qm-sort-icon" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="qm-select-styled"
                  aria-label="Sort question bank"
                >
                  <option value="default">Default Order</option>
                  <option value="alpha">Alphabetical</option>
                  <option value="difficulty">By Difficulty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {paginatedQuestions.length === 0 ? (
            <div className="qm-empty-cart-card">
              <p>No questions match your current search or filter criteria.</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="qm-cards-grid">
                {paginatedQuestions.map((q) => {
                  const inCart = isInCart(q.id)

                  return (
                    <div key={q.id} className="qm-deck-card">
                      <div className="qm-deck-card__header">
                        <span className="qm-deck-card__cat-badge">{q.category}</span>
                        <span className={`qm-badge qm-badge--${q.difficulty}`}>
                          {q.difficulty}
                        </span>
                      </div>

                      <h3 className="qm-deck-card__question">{q.question}</h3>

                      <div className="qm-deck-card__options">
                        {q.options?.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`qm-deck-card__option ${opt.isCorrect ? 'qm-deck-card__option--correct' : ''}`}
                          >
                            <span className="qm-deck-card__opt-letter">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="qm-deck-card__opt-text">{opt.opt}</span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="qm-deck-card__check-icon" />
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="qm-deck-card__explanation">
                          💡 <strong>Note:</strong> {q.explanation}
                        </p>
                      )}

                      <div className="qm-deck-card__footer">
                        <button
                          type="button"
                          className={`btn btn--sm ${inCart ? 'btn--secondary' : 'btn--primary'} qm-btn-flex`}
                          onClick={() => {
                            if (inCart) {
                              removeFromCart(q.id)
                              showToast('Removed from Study Cart', 'info')
                            } else {
                              addToCart(q)
                              showToast('Added to Study Cart!', 'success')
                            }
                          }}
                        >
                          <ShoppingBagIcon />
                          <span>{inCart ? 'In Study Cart ✓' : 'Add to Study Cart'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Numbered Pagination */}
              <Pagination
                currentPage={page}
                totalItems={filteredExplorerQuestions.length}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                  setPage(newPage)
                  window.scrollTo({ top: 300, behavior: 'smooth' })
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
              />
            </>
          )}
        </section>
      )}

      {/* ================= MODAL: CREATE / EDIT QUESTION (CRUD) ================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingQuestion ? 'Edit Custom Question' : 'Author New Custom Question'}
        subtitle="Fill in the question details and configure the correct answer"
        maxWidth="lg"
        footer={
          <div className="qm-modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSaveQuestion}
            >
              {editingQuestion ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveQuestion} className="qm-modal-form" noValidate>
          <TextareaField
            id="q-prompt"
            label="Question Prompt"
            value={formData.question}
            onChange={(e) => handleFormFieldChange('question', e.target.value)}
            onBlur={() => handleBlur('question')}
            placeholder="e.g. Which planet is known as the Red Planet?"
            error={formErrors.question}
            touched={formTouched.question}
            required
            rows={2}
          />

          <div className="qm-form-row">
            <SelectField
              id="q-category"
              label="Subject Category"
              value={formData.category}
              onChange={(e) => handleFormFieldChange('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              error={formErrors.category}
              touched={formTouched.category}
              required
            />

            <SelectField
              id="q-difficulty"
              label="Difficulty Level"
              value={formData.difficulty}
              onChange={(e) => handleFormFieldChange('difficulty', e.target.value)}
              onBlur={() => handleBlur('difficulty')}
              options={difficultyLevels.map((d) => ({ value: d.id, label: d.name }))}
              error={formErrors.difficulty}
              touched={formTouched.difficulty}
              required
            />
          </div>

          <div className="qm-form-options-box">
            <div className="qm-form-options-header">
              <label className="qm-form-label">
                Answer Options & Correct Answer Selection <span className="qm-form-required">*</span>
              </label>
              <span className="qm-form-sublabel">Select the radio button next to the correct choice</span>
            </div>

            {[1, 2, 3, 4].map((idx) => {
              const fieldName = `option${idx}`
              const isSelected = formData.correctOptionIndex === idx - 1

              return (
                <div key={idx} className="qm-form-opt-item">
                  <label className="qm-radio-wrapper" title="Mark as correct answer">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={isSelected}
                      onChange={() => handleFormFieldChange('correctOptionIndex', idx - 1)}
                      className="qm-radio-input"
                    />
                    <span className="qm-radio-disc">
                      <span className="qm-radio-inner" />
                    </span>
                    <span className="qm-opt-tag">{String.fromCharCode(64 + idx)}</span>
                  </label>

                  <div style={{ flex: 1 }}>
                    <TextInput
                      id={`q-opt-${idx}`}
                      value={formData[fieldName]}
                      onChange={(e) => handleFormFieldChange(fieldName, e.target.value)}
                      onBlur={() => handleBlur(fieldName)}
                      placeholder={`Option ${String.fromCharCode(64 + idx)} content`}
                      error={formErrors[fieldName]}
                      touched={formTouched[fieldName]}
                      required
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <TextareaField
            id="q-explanation"
            label="Explanation / Educational Note"
            value={formData.explanation}
            onChange={(e) => handleFormFieldChange('explanation', e.target.value)}
            onBlur={() => handleBlur('explanation')}
            placeholder="Explain why this answer is correct to help students learn..."
            error={formErrors.explanation}
            touched={formTouched.explanation}
            required
            rows={2}
          />
        </form>
      </Modal>

      {/* ================= MODAL: CONFIRM DELETE QUESTION ================= */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Custom Question"
        maxWidth="sm"
        footer={
          <div className="qm-modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDeleteConfirm}
            >
              Delete Question
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to permanently delete this custom question? This action cannot be
          undone.
        </p>
      </Modal>

      {/* ================= MODAL: CONFIRM CLEAR CART ================= */}
      <Modal
        isOpen={clearCartConfirm}
        onClose={() => setClearCartConfirm(false)}
        title="Empty Study Cart"
        maxWidth="sm"
        footer={
          <div className="qm-modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setClearCartConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                clearCart()
                showToast('Study Cart has been cleared', 'info')
                setClearCartConfirm(false)
              }}
            >
              Empty Cart
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to remove all saved questions from your Study Cart?
        </p>
      </Modal>
    </div>
  )
}
