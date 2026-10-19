import { useState, useEffect } from 'react'

/**
 * useDebounce hook to delay updating state until the user has stopped typing
 * Practical topic: Debounce pattern for search and filter inputs
 * @param {any} value Value to debounce
 * @param {number} delay Delay in milliseconds (default 300ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
