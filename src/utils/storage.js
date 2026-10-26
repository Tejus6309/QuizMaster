import {
  getSupabaseConfig,
  fetchQuizResultsFromSupabase,
  syncMultipleQuizResultsToSupabase,
  deleteQuizResultFromSupabase,
} from '../lib/supabase.js'

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
 * Retrieves all results exclusive to the specified or current user from localStorage
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
 * Merges remote results from Supabase into local storage, recalculates personal bests, and persists
 */
export function mergeResultsIntoStorage(remoteResults, targetUserId = null) {
  if (!Array.isArray(remoteResults)) return getAllResults(targetUserId)

  try {
    const uid = getActiveUserIdentifier(targetUserId)
    const storageKey = getUserStorageKey(uid)
    const local = getAllResults(uid)

    const mergedMap = new Map()

    // 1. Prime map with local items
    local.forEach((r) => {
      const key = r.id || `${r.date}_${r.categoryName}_${r.correct}_${r.total}`
      mergedMap.set(key, r)
    })

    // 2. Overlay remote results
    remoteResults.forEach((remote) => {
      const key = remote.id || `${remote.date}_${remote.categoryName}_${remote.correct}_${remote.total}`
      const existing = mergedMap.get(key)
      if (existing) {
        mergedMap.set(key, { ...existing, ...remote, isSynced: true })
      } else {
        // Also check approximate duplicate
        let foundKey = null
        for (const [k, item] of mergedMap.entries()) {
          const timeDiff = Math.abs(new Date(item.date).getTime() - new Date(remote.date).getTime())
          if (
            item.categoryName === remote.categoryName &&
            item.correct === remote.correct &&
            item.total === remote.total &&
            item.percentage === remote.percentage &&
            (isNaN(timeDiff) || timeDiff < 5000)
          ) {
            foundKey = k
            break
          }
        }

        if (foundKey) {
          const prev = mergedMap.get(foundKey)
          mergedMap.set(foundKey, { ...prev, ...remote, id: remote.id || prev.id, isSynced: true })
        } else {
          mergedMap.set(key, { ...remote, userId: uid, isSynced: true })
        }
      }
    })

    const combined = Array.from(mergedMap.values())

    // Sort chronologically ascending to recalculate personal bests accurately
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const bestTracker = {}
    combined.forEach((item) => {
      const cat = item.categoryName || 'Mixed'
      const prevBest = bestTracker[cat]
      const isPb =
        !prevBest ||
        item.percentage > prevBest.percentage ||
        (item.percentage === prevBest.percentage && item.time < prevBest.time)

      item.isPersonalBest = isPb
      if (isPb) {
        bestTracker[cat] = { percentage: item.percentage, time: item.time }
      }
    })

    // Sort descending by date (newest first)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const finalResults = combined.slice(0, 100)
    localStorage.setItem(storageKey, JSON.stringify(finalResults))

    window.dispatchEvent(
      new CustomEvent('quizmaster-results-updated', {
        detail: { userId: uid, source: 'supabase-cloud-sync' },
      })
    )

    return finalResults
  } catch (err) {
    console.error('Failed to merge remote results into storage:', err)
    return getAllResults(targetUserId)
  }
}

/**
 * Two-way cloud sync with Supabase:
 * 1. Fetches latest results from Supabase
 * 2. Uploads any unsynced local results
 * 3. Merges remote records into localStorage and dispatches update
 */
export async function syncResultsWithCloud(user) {
  if (!user) {
    return {
      success: false,
      reason: 'No authenticated user',
      results: getAllResults('guest'),
    }
  }

  const config = getSupabaseConfig()
  if (!config.isConfigured) {
    return {
      success: false,
      reason: 'Supabase is not configured',
      results: getAllResults(user.id),
    }
  }

  try {
    // 1. Fetch remote records from Supabase
    const { data: remoteResults, error, tableMissing } = await fetchQuizResultsFromSupabase(user)

    if (tableMissing) {
      return {
        success: false,
        tableMissing: true,
        error: 'Table "quiz_results" does not exist in Supabase schema yet.',
        results: getAllResults(user.id),
      }
    }

    if (error) {
      return {
        success: false,
        error,
        results: getAllResults(user.id),
      }
    }

    // 2. Identify and push any local records missing from Supabase
    const local = getAllResults(user.id)
    const remoteIdSet = new Set((remoteResults || []).map((r) => String(r.id)))

    const pendingUploads = local.filter((l) => {
      if (!l.id) return false
      return !remoteIdSet.has(String(l.id))
    })

    let uploadedCount = 0
    if (pendingUploads.length > 0) {
      const uploadRes = await syncMultipleQuizResultsToSupabase(pendingUploads, user)
      if (uploadRes.synced) {
        uploadedCount = uploadRes.count || pendingUploads.length
      }
    }

    // 3. Merge remote results into local storage
    const merged = mergeResultsIntoStorage(remoteResults || [], user.id)

    // 4. Record sync time
    const nowIso = new Date().toISOString()
    try {
      localStorage.setItem(`qm_last_synced_${user.id}`, nowIso)
    } catch (_e) {
      // Ignore localStorage write error if quota exceeded
    }

    return {
      success: true,
      results: merged,
      count: merged.length,
      remoteCount: (remoteResults || []).length,
      uploadedCount,
      lastSynced: new Date(nowIso),
    }
  } catch (err) {
    console.warn('syncResultsWithCloud error:', err)
    return {
      success: false,
      error: err.message,
      results: getAllResults(user.id),
    }
  }
}

/**
 * Returns the timestamp of the last successful Supabase cloud sync
 */
export function getLastSyncedTime(userId = null) {
  try {
    const uid = getActiveUserIdentifier(userId)
    const raw = localStorage.getItem(`qm_last_synced_${uid}`)
    return raw ? new Date(raw) : null
  } catch {
    return null
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
 * Deletes an attempt exclusive to this user account and syncs deletion to Supabase
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

    // Delete from Supabase in background
    deleteQuizResultFromSupabase(id, { id: uid })

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
