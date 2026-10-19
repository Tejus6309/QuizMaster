import { useState, useEffect, useRef, useCallback } from 'react'

export function useQuizTimer(durationPerQuestion, onTimeout, isRunning = true) {
  const [timeLeft, setTimeLeft] = useState(durationPerQuestion)
  const onTimeoutRef = useRef(onTimeout)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const reset = useCallback(() => {
    hasFiredRef.current = false
    setTimeLeft(durationPerQuestion)
  }, [durationPerQuestion])

  useEffect(() => {
    if (!isRunning) return

    if (timeLeft <= 0) {
      if (!hasFiredRef.current) {
        hasFiredRef.current = true
        onTimeoutRef.current?.()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isRunning])

  return { timeLeft, reset }
}


