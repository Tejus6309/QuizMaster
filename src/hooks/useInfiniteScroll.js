import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(callback, hasMore) {
  const [loading, setLoading] = useState(false)
  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!hasMore || loading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true)
          callback().finally(() => setLoading(false))
        }
      },
      { rootMargin: '100px' }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [callback, hasMore, loading])

  return { sentinelRef, loading }
}
