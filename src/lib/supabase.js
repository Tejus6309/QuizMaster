import { createClient } from '@supabase/supabase-js'

// Default credentials embedded in code
const DEFAULT_SUPABASE_KEY = 'sb_publishable_8NG3RdBhvRuz7FihQaqjcQ_1eSYMW6S'
const DEFAULT_SUPABASE_URL = 'https://ezpgnkcddoellfoddlbd.supabase.co'

const CUSTOM_CONFIG_KEY = 'quizmaster_custom_supabase_config'

function readCustomConfig() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.url && parsed?.anonKey) return parsed
    }
  } catch (err) {
    console.warn('Failed to read custom Supabase config:', err)
  }
  return null
}

export function getSupabaseConfig() {
  const custom = readCustomConfig()
  const url =
    custom?.url?.trim() ||
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    DEFAULT_SUPABASE_URL
  const anonKey =
    custom?.anonKey?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    DEFAULT_SUPABASE_KEY

  const isValidUrl =
    Boolean(url) &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('example.supabase.co')

  const isValidKey =
    Boolean(anonKey) &&
    (anonKey.startsWith('sb_publishable_') || anonKey.length > 20)

  return {
    url,
    anonKey,
    isConfigured: isValidUrl && isValidKey,
    isCustom: Boolean(custom),
  }
}

let clientInstance = null

function initClient() {
  const config = getSupabaseConfig()
  if (config.isConfigured) {
    try {
      clientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    } catch (err) {
      console.warn('Supabase initialization warning:', err)
      clientInstance = null
    }
  } else {
    clientInstance = null
  }
  return clientInstance
}

// Initial client creation
initClient()

export const supabase = clientInstance
export const isSupabaseConfigured = getSupabaseConfig().isConfigured

export function getSupabaseClient() {
  if (!clientInstance) {
    initClient()
  }
  return clientInstance
}

export function saveSupabaseConfig(url, anonKey) {
  try {
    localStorage.setItem(
      CUSTOM_CONFIG_KEY,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    )
    initClient()
    window.dispatchEvent(new CustomEvent('quizmaster-supabase-config-changed'))
  } catch (err) {
    console.error('Failed to save Supabase config:', err)
  }
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem(CUSTOM_CONFIG_KEY)
    initClient()
    window.dispatchEvent(new CustomEvent('quizmaster-supabase-config-changed'))
  } catch (err) {
    console.error('Failed to clear Supabase config:', err)
  }
}

export async function testSupabaseConnection(url, anonKey) {
  try {
    const tempClient = createClient(url.trim(), anonKey.trim())
    const { error } = await tempClient.from('quiz_results').select('id').limit(1)

    if (error) {
      // PGRST205 indicates the connection was successful, but the table hasn't been created yet
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          success: true,
          tableMissing: true,
          message:
            'Connected to Supabase project! (Table "quiz_results" is not yet created in SQL Editor)',
        }
      }
      if (
        error.code === '401' ||
        error.code === 'PGRST301' ||
        error.message?.toLowerCase().includes('jwt') ||
        error.message?.toLowerCase().includes('api key')
      ) {
        return {
          success: false,
          message: 'Invalid Anon Key or authentication rejected by Supabase.',
        }
      }
    }
    return {
      success: true,
      message: 'Supabase connection verified successfully! Database is ready.',
    }
  } catch (err) {
    return { success: false, message: err.message || 'Failed to connect to Supabase.' }
  }
}

/**
 * Pushes a single quiz result to Supabase table `quiz_results` with UPSERT to prevent duplicates
 */
export async function syncQuizResultToSupabase(result, user) {
  const client = getSupabaseClient()
  if (!client || !user) return { synced: false, error: 'No active Supabase client or user' }

  try {
    const payload = {
      id: String(result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      user_id: String(user.id || 'guest'),
      user_email: user.email || 'guest',
      category: result.categoryName || 'Mixed',
      difficulty: result.difficulty || 'Normal',
      score: Number(result.correct) || 0,
      total_questions: Number(result.total) || 0,
      percentage: Number(result.percentage) || 0,
      accuracy:
        result.accuracy !== undefined ? Number(result.accuracy) : Number(result.percentage) || 0,
      total_time: Number(result.time) || 0,
      created_at: result.date || new Date().toISOString(),
    }

    const { error } = await client.from('quiz_results').upsert([payload], {
      onConflict: 'id',
    })

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache')
      console.warn('Could not sync to quiz_results table:', error.message)
      return { synced: false, error: error.message, tableMissing: isMissing }
    }

    return { synced: true }
  } catch (err) {
    console.warn('syncQuizResultToSupabase error:', err)
    return { synced: false, error: err.message }
  }
}

/**
 * Pushes multiple quiz results to Supabase table `quiz_results` in a single batch
 */
export async function syncMultipleQuizResultsToSupabase(results, user) {
  const client = getSupabaseClient()
  if (!client || !user || !results || results.length === 0) {
    return { synced: false, count: 0 }
  }

  try {
    const payloads = results.map((result) => ({
      id: String(result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      user_id: String(user.id || 'guest'),
      user_email: user.email || 'guest',
      category: result.categoryName || 'Mixed',
      difficulty: result.difficulty || 'Normal',
      score: Number(result.correct) || 0,
      total_questions: Number(result.total) || 0,
      percentage: Number(result.percentage) || 0,
      accuracy:
        result.accuracy !== undefined ? Number(result.accuracy) : Number(result.percentage) || 0,
      total_time: Number(result.time) || 0,
      created_at: result.date || new Date().toISOString(),
    }))

    const { error } = await client.from('quiz_results').upsert(payloads, {
      onConflict: 'id',
    })

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache')
      console.warn('Batch sync error:', error.message)
      return { synced: false, error: error.message, tableMissing: isMissing }
    }

    return { synced: true, count: payloads.length }
  } catch (err) {
    console.warn('syncMultipleQuizResultsToSupabase exception:', err)
    return { synced: false, error: err.message }
  }
}

/**
 * Fetches all completed quiz results for this user from Supabase `quiz_results` table
 */
export async function fetchQuizResultsFromSupabase(user) {
  const client = getSupabaseClient()
  if (!client || !user) {
    return { data: [], error: 'Supabase client not initialized or no user logged in' }
  }

  try {
    let query = client
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false })

    if (user.id) {
      query = query.eq('user_id', String(user.id))
    } else if (user.email) {
      query = query.eq('user_email', String(user.email))
    }

    const { data, error } = await query

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' || error.message?.includes('schema cache')
      return {
        data: [],
        error: error.message,
        code: error.code,
        tableMissing: isMissingTable,
      }
    }

    // Transform database rows to standard frontend result objects
    const formatted = (data || []).map((row) => ({
      id: String(row.id),
      userId: row.user_id || user.id,
      userEmail: row.user_email || user.email,
      categoryName: row.category || 'Mixed',
      difficulty: row.difficulty || 'Normal',
      percentage: Number(row.percentage) || 0,
      accuracy:
        row.accuracy !== null && row.accuracy !== undefined
          ? Number(row.accuracy)
          : Number(row.percentage) || 0,
      correct: Number(row.score) || 0,
      total: Number(row.total_questions) || 0,
      incorrect: Math.max(
        0,
        (Number(row.total_questions) || 0) - (Number(row.score) || 0)
      ),
      skipped: 0,
      time: Number(row.total_time) || 0,
      date: row.created_at || new Date().toISOString(),
      isSynced: true,
    }))

    return { data: formatted, error: null }
  } catch (err) {
    console.warn('fetchQuizResultsFromSupabase exception:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Listens in real-time to inserts or updates on `quiz_results` for the active user
 */
export function subscribeToQuizResults(user, onRemoteChange) {
  const client = getSupabaseClient()
  if (!client || !user) return () => {}

  try {
    const channelName = `quiz_results_sync_${user.id || 'user'}_${Math.random()
      .toString(36)
      .substring(2, 7)}`

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_results',
        },
        (payload) => {
          if (
            !payload.new ||
            !payload.new.user_id ||
            String(payload.new.user_id) === String(user.id)
          ) {
            onRemoteChange(payload)
          }
        }
      )
      .subscribe()

    return () => {
      try {
        client.removeChannel(channel)
      } catch (_e) {
        // Channel already closed or removed
      }
    }
  } catch (err) {
    console.warn('Realtime subscription error:', err)
    return () => {}
  }
}

/**
 * Removes a result from Supabase `quiz_results` table
 */
export async function deleteQuizResultFromSupabase(resultId, user) {
  const client = getSupabaseClient()
  if (!client || !resultId) return { success: false }

  try {
    let query = client.from('quiz_results').delete().eq('id', String(resultId))
    if (user?.id) {
      query = query.eq('user_id', String(user.id))
    }

    const { error } = await query
    if (error) {
      console.warn('Could not delete from quiz_results:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.warn('deleteQuizResultFromSupabase error:', err)
    return { success: false, error: err.message }
  }
}
