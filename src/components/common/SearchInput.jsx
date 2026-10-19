import { useState, useEffect } from 'react'
import { Filter, X } from '../icons/Icons.jsx'
import { useDebounce } from '../../hooks/useDebounce.js'

// Simple SVG Search Icon
function SearchIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/**
 * Reusable SearchInput with debounced change notification
 * Practical topics: Search patterns & Debounce
 */
export default function SearchInput({
  value: controlledValue,
  onDebouncedChange,
  onChange,
  placeholder = 'Search...',
  delay = 300,
  className = '',
  id = 'search-input',
}) {
  const [internalValue, setInternalValue] = useState(controlledValue || '')
  const debounced = useDebounce(internalValue, delay)

  // Keep internal value synced if external value changes
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  // Trigger debounced callback
  useEffect(() => {
    if (onDebouncedChange) {
      onDebouncedChange(debounced)
    }
  }, [debounced, onDebouncedChange])

  const handleChange = (e) => {
    const val = e.target.value
    setInternalValue(val)
    if (onChange) onChange(e)
  }

  const handleClear = () => {
    setInternalValue('')
    if (onChange) onChange({ target: { value: '' } })
    if (onDebouncedChange) onDebouncedChange('')
  }

  return (
    <div className={`qm-search-wrapper ${className}`}>
      <span className="qm-search-icon">
        <SearchIcon />
      </span>
      <input
        id={id}
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="qm-search-input"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="qm-search-clear"
          title="Clear search"
          aria-label="Clear search"
        >
          <X />
        </button>
      )}
    </div>
  )
}
