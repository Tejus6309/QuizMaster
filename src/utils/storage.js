const BASE_STORAGE_KEY = 'quizmaster_results'

/**
 * Returns current active user ID from local auth storage
 */
export function getActiveUserIdentifier(targetId = null) {
  if (targetId) return String(targetId).trim()

  try {
    const active =
      localStorage.getItem('quizmaster_active_user') ||
      localStorage.getItem('quizmaster_demo_auth_user')

    if (active) {
      const parsed = JSON.parse(active)
      if (parsed?.id) return String(parsed.id).trim()
      if (parsed?.email) return String(parsed.email).trim().toLowerCase()
    }
  } catch (err) {
    console.warn('Could not resolve active user identifier:', err)
  }

  return 'guest'
}

/**
 * Generates an exclusive storage key for each user account
 */
export function getUserStorageKey(userId = null) {
  const uid = getActiveUserIdentifier(userId)
  return `${BASE_STORAGE_KEY}_${uid}`
}

/**
 * Saves a quiz attempt exclusively for the specified or current user
 */
export function saveResult(result, targetUserId = null) {
  try {
    const uid = getActiveUserIdentifier(targetUserId || result?.userId)
    const storageKey = getUserStorageKey(uid)

    const existing = getAllResults(uid)
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

    // Determine Personal Best exclusively against this account's own history
    const prevBest = getBestScore(result.categoryName, uid)
    const isPersonalBest =
      !prevBest ||
      result.percentage > prevBest.percentage ||
      (result.percentage === prevBest.percentage && result.time < prevBest.time)

    const entryToSave = {
      ...result,
      userId: uid,
      isPersonalBest,
      accuracy:
        result.accuracy !== undefined
          ? result.accuracy
          : Math.round(
              (result.correct / Math.max(1, result.total - (result.skipped || 0))) * 100
            ) || 0,
    }

    existing.unshift(entryToSave)
    localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 100)))

    // Dispatch custom event so all active screens update their records immediately
    window.dispatchEvent(
      new CustomEvent('quizmaster-results-updated', { detail: { userId: uid } })
    )

    return entryToSave
  } catch (e) {
    console.error('Failed to save result:', e)
    return null
  }
}

/**
 * Retrieves all results exclusive to the specified or current user
 */
export function getAllResults(targetUserId = null) {
  try {
    const uid = getActiveUserIdentifier(targetUserId)
    const storageKey = getUserStorageKey(uid)

    let data = localStorage.getItem(storageKey)

    // Fallback: If user-specific key is empty and it's guest, check legacy key
    if (!data && uid === 'guest') {
      data = localStorage.getItem(BASE_STORAGE_KEY)
    }

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

/**
 * Returns personal best score exclusive to this user account
 */
export function getBestScore(categoryName = null, targetUserId = null) {
  const results = getAllResults(targetUserId)
  if (results.length === 0) return null

  const filtered =
    categoryName && categoryName !== 'Mixed'
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

/**
 * Deletes an attempt exclusive to this user account
 */
export function deleteResult(id, targetUserId = null) {
  try {
    const uid = getActiveUserIdentifier(targetUserId)
    const storageKey = getUserStorageKey(uid)

    const existing = getAllResults(uid)
    const updated = existing.filter((r) => r.id !== id)
    localStorage.setItem(storageKey, JSON.stringify(updated))

    window.dispatchEvent(
      new CustomEvent('quizmaster-results-updated', { detail: { userId: uid } })
    )

    return updated
  } catch (e) {
    console.error('Failed to delete result:', e)
    return getAllResults(targetUserId)
  }
}

/**
 * Clears attempt history exclusive to this user account
 */
export function clearResults(targetUserId = null) {
  try {
    const uid = getActiveUserIdentifier(targetUserId)
    const storageKey = getUserStorageKey(uid)
    localStorage.removeItem(storageKey)

    window.dispatchEvent(
      new CustomEvent('quizmaster-results-updated', { detail: { userId: uid } })
    )
  } catch (e) {
    console.error('Failed to clear results:', e)
  }
}

/**
 * Computes performance statistics exclusive to this user account
 */
export function getQuizStats(targetUserId = null) {
  const results = getAllResults(targetUserId)
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
  const bestAccuracy = Math.max(
    ...results.map((r) =>
      r.accuracy !== undefined ? r.accuracy : r.percentage || 0
    )
  )
  const totalScoreSum = results.reduce((sum, r) => sum + (r.percentage || 0), 0)
  const averageScore = Math.round(totalScoreSum / totalAttempts)

  return {
    totalAttempts,
    bestScore,
    bestAccuracy,
    averageScore,
  }
}
