import { supabase } from './supabaseClient.js'

export async function saveAttemptToDB(attemptData) {
  const { data, error } = await supabase
    .from('attempts')
    .insert(attemptData)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchAttempts(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit
  let query = supabase
    .from('attempts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.source) {
    query = query.eq('source', filters.source)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data, count, page, hasMore: offset + limit < count }
}

export async function fetchAttemptStats() {
  const { data, error } = await supabase
    .from('attempts')
    .select('percentage, accuracy, correct, total, category_name, source, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      bestAccuracy: 0,
      averageScore: 0,
      categoryPerformance: [],
      recentAttempts: [],
    }
  }

  const totalAttempts = data.length
  const bestScore = Math.max(...data.map((r) => r.percentage || 0))
  const bestAccuracy = Math.max(...data.map((r) => r.accuracy || 0))
  const averageScore = Math.round(
    data.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalAttempts
  )

  const categoryMap = {}
  data.forEach((r) => {
    const cat = r.category_name || 'Mixed'
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, sum: 0 }
    categoryMap[cat].total++
    categoryMap[cat].sum += r.percentage || 0
  })

  const categoryPerformance = Object.entries(categoryMap).map(([cat, v]) => ({
    category: cat,
    avgScore: Math.round(v.sum / v.total),
    count: v.total,
  }))

  return {
    totalAttempts,
    bestScore,
    bestAccuracy,
    averageScore,
    categoryPerformance,
    recentAttempts: data.slice(0, 5),
  }
}

export async function deleteAttemptDB(id) {
  const { error } = await supabase.from('attempts').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllAttemptsDB() {
  const { error } = await supabase.from('attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}
