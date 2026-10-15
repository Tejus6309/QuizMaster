import { supabase } from './supabaseClient.js'

export async function fetchTrivia(amount = 10, category = '', difficulty = '') {
  const params = new URLSearchParams()
  params.set('amount', String(amount))
  if (category) params.set('category', category)
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty)
  params.set('type', 'multiple')

  const { data, error } = await supabase.functions.invoke('trivia', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: { params: params.toString() },
  })

  if (error) throw error
  if (!data || !data.questions) throw new Error('Invalid trivia response')

  return data.questions
}

export const triviaCategories = [
  { id: '', name: 'Any Category' },
  { id: '9', name: 'General Knowledge' },
  { id: '17', name: 'Science & Nature' },
  { id: '18', name: 'Computers' },
  { id: '19', name: 'Mathematics' },
  { id: '20', name: 'Mythology' },
  { id: '21', name: 'Sports' },
  { id: '22', name: 'Geography' },
  { id: '23', name: 'History' },
  { id: '24', name: 'Politics' },
  { id: '25', name: 'Art' },
  { id: '26', name: 'Celebrities' },
  { id: '27', name: 'Animals' },
  { id: '28', name: 'Vehicles' },
  { id: '11', name: 'Film' },
  { id: '12', name: 'Music' },
  { id: '14', name: 'Television' },
  { id: '15', name: 'Video Games' },
  { id: '31', name: 'Anime & Manga' },
  { id: '32', name: 'Cartoon & Animation' },
]
