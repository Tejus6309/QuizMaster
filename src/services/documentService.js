import { supabase } from './supabaseClient.js'

export async function uploadDocumentToDB(docData) {
  const { data, error } = await supabase
    .from('documents')
    .insert(docData)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchDocuments(page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data, count, hasMore: offset + limit < count }
}

export async function deleteDocumentDB(id) {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}
