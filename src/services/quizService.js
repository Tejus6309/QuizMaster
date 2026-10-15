import { supabase } from './supabaseClient.js'

export async function saveQuizToDB(quizData) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchQuizzes(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit
  let query = supabase
    .from('quizzes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    query = query.eq('difficulty', filters.difficulty)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data, count, hasMore: offset + limit < count }
}

export async function fetchQuizById(id) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateQuizDB(id, updates) {
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deleteQuizDB(id) {
  const { error } = await supabase.from('quizzes').delete().eq('id', id)
  if (error) throw error
}
