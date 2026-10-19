import { useMemo } from 'react'
import { questionBank } from '../data/questionBank'
import { shuffle } from '../utils/helpers'

export function useQuestionBank(config) {
  const { category, difficulty, count = 10, customQuestions } = config || {}

  return useMemo(() => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions.map((q) => {
        // If question options are already objects with isCorrect, preserve them or shuffle
        if (q.options && typeof q.options[0] === 'object' && q.options[0].isCorrect !== undefined) {
          return {
            ...q,
            options: shuffle(q.options),
          }
        }
        return {
          ...q,
          options: shuffle(q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }))),
        }
      })
    }

    const targetCount = Number(count) || 10

    // 1. Primary filter: exact category & difficulty match
    let exactMatches = questionBank.filter((q) => {
      const matchCategory = !category || category === 'all' || q.category === category
      const matchDifficulty = !difficulty || difficulty === 'all' || q.difficulty === difficulty
      return matchCategory && matchDifficulty
    })

    const selectedPool = [...shuffle(exactMatches)]
    const selectedIds = new Set(selectedPool.map((q) => q.id))

    // 2. Fallback 1: Same category, any difficulty
    if (selectedPool.length < targetCount && category && category !== 'all') {
      const categoryFallbacks = shuffle(
        questionBank.filter((q) => q.category === category && !selectedIds.has(q.id))
      )
      for (const q of categoryFallbacks) {
        if (selectedPool.length >= targetCount) break
        selectedPool.push(q)
        selectedIds.add(q.id)
      }
    }

    // 3. Fallback 2: Same difficulty, any category
    if (selectedPool.length < targetCount && difficulty && difficulty !== 'all') {
      const difficultyFallbacks = shuffle(
        questionBank.filter((q) => q.difficulty === difficulty && !selectedIds.has(q.id))
      )
      for (const q of difficultyFallbacks) {
        if (selectedPool.length >= targetCount) break
        selectedPool.push(q)
        selectedIds.add(q.id)
      }
    }

    // 4. Fallback 3: Any remaining questions in the bank
    if (selectedPool.length < targetCount) {
      const anyFallbacks = shuffle(
        questionBank.filter((q) => !selectedIds.has(q.id))
      )
      for (const q of anyFallbacks) {
        if (selectedPool.length >= targetCount) break
        selectedPool.push(q)
        selectedIds.add(q.id)
      }
    }

    const selected = selectedPool.slice(0, targetCount)

    return selected.map((q) => ({
      ...q,
      options: shuffle(q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }))),
    }))
  }, [category, difficulty, count, customQuestions])
}

