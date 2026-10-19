import { ArrowLeft, ArrowRight } from '../icons/Icons.jsx'

/**
 * Reusable Pagination component
 * Practical topic: Pagination, infinite scroll, debounce
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Calculate visible page buttons (max 5 around current)
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className={`qm-pagination ${className}`}>
      <div className="qm-pagination__info">
        Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> items
      </div>

      <div className="qm-pagination__controls">
        <button
          type="button"
          className="qm-pagination__btn qm-pagination__btn--nav"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
        >
          <ArrowLeft />
          <span>Prev</span>
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              className="qm-pagination__page-btn"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="qm-pagination__ellipsis">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`qm-pagination__page-btn ${p === currentPage ? 'qm-pagination__page-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="qm-pagination__ellipsis">...</span>
            )}
            <button
              type="button"
              className="qm-pagination__page-btn"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="qm-pagination__btn qm-pagination__btn--nav"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ArrowRight />
        </button>
      </div>

      {onPageSizeChange && (
        <div className="qm-pagination__size-selector">
          <label htmlFor="qm-page-size" className="qm-pagination__size-label">
            Per page:
          </label>
          <select
            id="qm-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="qm-pagination__select"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
