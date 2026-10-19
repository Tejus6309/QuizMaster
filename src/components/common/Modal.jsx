import { useEffect } from 'react'
import { X } from '../icons/Icons.jsx'

/**
 * Reusable accessible Modal dialog component
 * Practical topic: Modal, tabs, dropdowns, toast notifications
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md', // 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Disable body scroll when modal is open
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="qm-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`qm-modal-card qm-modal-card--${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qm-modal-header">
          <div className="qm-modal-title-group">
            {title && <h2 className="qm-modal-title">{title}</h2>}
            {subtitle && <p className="qm-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="qm-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>

        <div className="qm-modal-body">{children}</div>

        {footer && <div className="qm-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
