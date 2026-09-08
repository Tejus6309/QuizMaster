const STORAGE_KEY = 'quizmaster_results'

export function saveResult(result) {
  try {
    const existing = getAllResults()
    const isDuplicate = existing.some((r) => {
      if (result.id && r.id === result.id) return true
      const timeDiff = Math.abs(new Date(r.date).getTime() - new Date(result.date).getTime())
      return (
        r.categoryName === result.categoryName &&
        r.percentage === result.percentage &&
        r.correct === result.correct &&
        r.total === result.total &&
        r.time === result.time &&
        (isNaN(timeDiff) || timeDiff < 5000)
      )
    })
    if (isDuplicate) return null

    // Determine if this result is a Personal Best for its category/difficulty or overall
    const prevBest = getBestScore(result.categoryName)
    const isPersonalBest = !prevBest || result.percentage > prevBest.percentage || (result.percentage === prevBest.percentage && result.time < prevBest.time)

    const entryToSave = {
      ...result,
      isPersonalBest,
      accuracy: result.accuracy !== undefined ? result.accuracy : Math.round((result.correct / Math.max(1, result.total - (result.skipped || 0))) * 100) || 0
    }

    existing.unshift(entryToSave)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 100)))
    return entryToSave
  } catch (e) {
    console.error('Failed to save result:', e)
    return null
  }
}

export function getAllResults() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []

    const cleaned = []
    for (const r of parsed) {
      const isDup = cleaned.some((c) => {
        if (r.id && c.id === r.id) return true
        const timeDiff = Math.abs(new Date(c.date).getTime() - new Date(r.date).getTime())
        return (
          c.categoryName === r.categoryName &&
          c.percentage === r.percentage &&
          c.correct === r.correct &&
          c.total === r.total &&
          c.time === r.time &&
          (isNaN(timeDiff) || timeDiff < 5000)
        )
      })
      if (!isDup) {
        cleaned.push(r)
      }
    }
    return cleaned
  } catch {
    return []
  }
}

export function getBestScore(categoryName = null) {
  const results = getAllResults()
  if (results.length === 0) return null

  const filtered = categoryName && categoryName !== 'Mixed'
    ? results.filter((r) => r.categoryName === categoryName)
    : results

  if (filtered.length === 0) return null

  return filtered.reduce((best, r) => {
    if (!best) return r
    if (r.percentage > best.percentage) return r
    if (r.percentage === best.percentage && r.time < best.time) return r
    return best
  }, null)
}

export function deleteResult(id) {
  try {
    const existing = getAllResults()
    const updated = existing.filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('Failed to delete result:', e)
    return getAllResults()
  }
}

export function clearResults() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear results:', e)
  }
}

export function getQuizStats() {
  const results = getAllResults()
  if (results.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      bestAccuracy: 0,
      averageScore: 0,
    }
  }

  const totalAttempts = results.length
  const bestScore = Math.max(...results.map((r) => r.percentage || 0))
  const bestAccuracy = Math.max(...results.map((r) => r.accuracy !== undefined ? r.accuracy : r.percentage || 0))
  const totalScoreSum = results.reduce((sum, r) => sum + (r.percentage || 0), 0)
  const averageScore = Math.round(totalScoreSum / totalAttempts)

  return {
    totalAttempts,
    bestScore,
    bestAccuracy,
    averageScore,
  }
}

