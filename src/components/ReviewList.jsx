import { useState } from 'react'
import { Check, X, Flag, SkipForward } from './icons/Icons.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
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

const letters = ['A', 'B', 'C', 'D', 'E', 'F']

export default function ReviewList({ questions, answers, markedForReview = {} }) {
  const [filter, setFilter] = useState('all')
  const { addToCart, removeFromCart, isInCart } = useQuizStore()
  const { showToast } = useToast()

  const items = questions.map((q, qi) => {
    const userAnswer = answers[qi]
    const isSkipped = userAnswer === null || userAnswer === undefined
    const isCorrect = !isSkipped && q.options[userAnswer]?.isCorrect
    const isMarked = !!markedForReview[qi]

    let status = 'incorrect'
    if (isCorrect) status = 'correct'
    else if (isSkipped) status = 'skipped'

    return { question: q, index: qi, userAnswer, isCorrect, isSkipped, isMarked, status }
  })

  const filteredItems = items.filter((item) => {
    if (filter === 'incorrect') return item.status === 'incorrect' || item.status === 'skipped'
    if (filter === 'skipped') return item.status === 'skipped'
    if (filter === 'marked') return item.isMarked
    return true
  })

  const countCorrect = items.filter((i) => i.status === 'correct').length
  const countIncorrect = items.filter((i) => i.status === 'incorrect').length
  const countSkipped = items.filter((i) => i.status === 'skipped').length
  const countMarked = items.filter((i) => i.isMarked).length

  return (
    <div className="review-list">
      <div className="review-list__header">
        <h3 className="review-list__title">Detailed Per-Question Review</h3>

        <div className="review-list__filters">
          <button
            className={`filter-chip ${filter === 'all' ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({questions.length})
          </button>
          <button
            className={`filter-chip ${filter === 'incorrect' ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter('incorrect')}
          >
            Incorrect ({countIncorrect + countSkipped})
          </button>
          <button
            className={`filter-chip ${filter === 'skipped' ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter('skipped')}
          >
            Skipped ({countSkipped})
          </button>
          {countMarked > 0 && (
            <button
              className={`filter-chip ${filter === 'marked' ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter('marked')}
            >
              Marked ({countMarked})
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="review-list__empty">
          <p>No questions match the selected filter.</p>
        </div>
      ) : (
        filteredItems.map(({ question: q, index: qi, userAnswer, isCorrect, isSkipped, isMarked, status }) => {
          const inCart = isInCart(q.id)

          return (
            <div key={q.id || qi} className={`review-item review-item--${status}`}>
              <div className="review-item__header">
                <div className="review-item__badge-group">
                  <span className={`review-item__badge review-item__badge--${status}`}>
                    {isCorrect ? <Check /> : isSkipped ? <SkipForward /> : <X />}
                  </span>
                  <span className="review-item__number">Question {qi + 1}</span>
                  <span className={`review-item__status-text review-item__status-text--${status}`}>
                    {isCorrect ? 'Correct' : isSkipped ? 'Skipped / Timed Out' : 'Incorrect'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMarked && (
                    <span className="review-item__marked-tag">
                      <Flag filled /> Marked for review
                    </span>
                  )}

                  <button
                    type="button"
                    className={`qm-review-cart-btn ${inCart ? 'qm-review-cart-btn--active' : ''}`}
                    onClick={() => {
                      if (inCart) {
                        removeFromCart(q.id)
                        showToast('Removed from Study Cart', 'info')
                      } else {
                        addToCart(q)
                        showToast('Saved question to Study Cart!', 'success')
                      }
                    }}
                    title={inCart ? 'Remove from Study Cart' : 'Save question to Study Cart for later'}
                  >
                    <ShoppingBagIcon />
                    <span>{inCart ? 'In Cart ✓' : 'Save to Cart'}</span>
                  </button>
                </div>
              </div>

              <p className="review-item__question">{q.question}</p>

              <div className="review-item__options">
                {q.options.map((opt, oi) => {
                  let cls = 'review-item__option'
                  if (opt.isCorrect) cls += ' review-item__option--correct'
                  else if (oi === userAnswer && !opt.isCorrect) cls += ' review-item__option--wrong'

                  return (
                    <div key={oi} className={cls}>
                      <span className="review-item__option-letter">{letters[oi]}</span>
                      <span className="review-item__option-text">{opt.opt}</span>
                      {opt.isCorrect && (
                        <span className="review-item__correct-label">
                          <Check /> Correct Answer
                        </span>
                      )}
                      {oi === userAnswer && !opt.isCorrect && (
                        <span className="review-item__user-label">
                          <X /> Your Answer
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {q.explanation && (
                <div className="review-item__explanation-box">
                  <span className="review-item__explanation-title">Explanation:</span>
                  <p className="review-item__explanation-text">{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
