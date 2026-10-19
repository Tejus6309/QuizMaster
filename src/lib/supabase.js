import { createClient } from '@supabase/supabase-js'

// Embedded credentials configured in code
const DEFAULT_SUPABASE_KEY = 'sb_publishable_8NG3RdBhvRuz7FihQaqjcQ_1eSYMW6S'
const DEFAULT_SUPABASE_URL = 'https://ezpgnkcddoellfoddlbd.supabase.co'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_KEY

const isValidUrl =
  Boolean(SUPABASE_URL) &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_URL.includes('example.supabase.co')

const isValidKey =
  Boolean(SUPABASE_KEY) &&
  (SUPABASE_KEY.startsWith('sb_publishable_') || SUPABASE_KEY.length > 20)

export const isSupabaseConfigured = isValidUrl && isValidKey

let clientInstance = null

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
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
}

export const supabase = clientInstance

export function getSupabaseClient() {
  return clientInstance
}

export function getSupabaseConfig() {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_KEY,
    isConfigured: isSupabaseConfigured,
  }
}

/**
 * Pushes completed quiz results to Supabase table `quiz_results` if logged in
 */
export async function syncQuizResultToSupabase(result, user) {
  if (!clientInstance || !user) return { synced: false }

  try {
    const { error } = await clientInstance.from('quiz_results').insert([
      {
        id: result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: user.id,
        user_email: user.email,
        category: result.categoryName || 'Mixed',
        difficulty: result.difficulty || 'Normal',
        score: result.correct || 0,
        total_questions: result.total || 0,
        percentage: result.percentage || 0,
        accuracy: result.accuracy || 0,
        total_time: result.time || 0,
        created_at: result.date || new Date().toISOString(),
      },
    ])

    if (error) {
      console.warn('Could not sync to quiz_results table:', error.message)
      return { synced: false, error: error.message }
    }
    return { synced: true }
  } catch (err) {
    console.warn('Sync error:', err)
    return { synced: false, error: err.message }
  }
}
