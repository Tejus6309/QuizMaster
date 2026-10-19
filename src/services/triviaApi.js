import axios from 'axios'
import { shuffle } from '../utils/helpers.js'

// Open Trivia DB Category ID mappings
export const OPEN_TDB_CATEGORIES = [
  { id: 'all', name: 'All Categories (Mixed)' },
  { id: '9', name: 'General Knowledge' },
  { id: '17', name: 'Science & Nature' },
  { id: '18', name: 'Science: Computers' },
  { id: '19', name: 'Science: Mathematics' },
  { id: '23', name: 'History' },
  { id: '22', name: 'Geography' },
  { id: '11', name: 'Entertainment: Film' },
  { id: '12', name: 'Entertainment: Music' },
  { id: '21', name: 'Sports' },
  { id: '24', name: 'Politics' },
]

/**
 * Utility to decode HTML entities returned by Open Trivia DB
 */
function decodeHtml(html) {
  if (!html) return ''
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

const apiClient = axios.create({
  baseURL: 'https://opentdb.com',
  timeout: 8000,
})

/**
 * Fetches questions from Open Trivia DB using Axios with retry handling
 * Practical Topic: Consuming REST APIs with fetch/axios, loading states, retry, error handling
 */
export async function fetchTriviaQuestions({
  amount = 10,
  category = 'all',
  difficulty = 'all',
  maxRetries = 2,
} = {}) {
  const params = {
    amount: Math.min(Math.max(Number(amount) || 10, 5), 30),
    type: 'multiple',
  }

  if (category && category !== 'all') {
    params.category = category
  }

  if (difficulty && difficulty !== 'all') {
    params.difficulty = difficulty.toLowerCase()
  }

  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    try {
      const response = await apiClient.get('/api.php', { params })
      const data = response.data

      // OpenTDB Response Codes:
      // 0: Success
      // 1: No Results
      // 2: Invalid Parameter
      // 3: Token Not Found
      // 4: Token Empty
      // 5: Rate Limit (Too many requests, OpenTDB has a 5-second per-IP cooldown)
      if (data.response_code === 0 && Array.isArray(data.results) && data.results.length > 0) {
        return {
          success: true,
          questions: data.results.map((item, idx) => {
            const rawQuestion = decodeHtml(item.question)
            const correctAnswer = decodeHtml(item.correct_answer)
            const incorrectAnswers = item.incorrect_answers.map(decodeHtml)

            const rawOptions = [
              { opt: correctAnswer, isCorrect: true },
              ...incorrectAnswers.map((opt) => ({ opt, isCorrect: false })),
            ]

            return {
              id: `api-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              question: rawQuestion,
              options: shuffle(rawOptions),
              category: decodeHtml(item.category),
              difficulty: item.difficulty,
              explanation: `The correct answer is "${correctAnswer}".`,
              source: 'Open Trivia Database API',
            }
          }),
        }
      }

      if (data.response_code === 5) {
        throw new Error('Open Trivia DB rate limit reached. Please wait a few seconds before retrying.')
      }

      if (data.response_code === 1) {
        throw new Error('Not enough questions available for the selected parameters. Try selecting "All Categories" or a different difficulty.')
      }

      throw new Error(`Open Trivia DB returned status code ${data.response_code}`)
    } catch (err) {
      lastError = err
      attempt++
      if (attempt <= maxRetries) {
        // Exponential backoff wait before retry
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200))
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to fetch questions from Open Trivia DB',
    isRateLimit: lastError?.message?.includes('rate limit'),
  }
}
