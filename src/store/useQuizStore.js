import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shuffle } from '../utils/helpers.js'

function normalizeQuestions(rawQuestions) {
  return rawQuestions.map((q) => {
    if (q.options && typeof q.options[0] === 'object' && q.options[0].isCorrect !== undefined) {
      return { ...q, options: shuffle(q.options) }
    }
    return {
      ...q,
      options: shuffle(
        q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }))
      ),
    }
  })
}

export const useQuizStore = create(
  persist(
    (set, get) => ({
      questions: [],
      answers: [],
      markedForReview: {},
      currentIndex: 0,
      totalTime: 0,
      active: false,
      quizMeta: null,

      startQuiz: (rawQuestions, meta = null) => {
        const questions = normalizeQuestions(rawQuestions)
        set({
          questions,
          answers: [],
          markedForReview: {},
          currentIndex: 0,
          totalTime: 0,
          active: true,
          quizMeta: meta,
        })
      },

      setAnswer: (index, value) => {
        const answers = [...get().answers]
        answers[index] = value
        set({ answers })
      },

      toggleMark: (index) => {
        const markedForReview = { ...get().markedForReview }
        if (markedForReview[index]) delete markedForReview[index]
        else markedForReview[index] = true
        set({ markedForReview })
      },

      setCurrentIndex: (index) => set({ currentIndex: index }),

      tickTime: () => set({ totalTime: get().totalTime + 1 }),

      endQuiz: () => {
        const state = get()
        const finalAnswers = state.questions.map((_, i) =>
          state.answers[i] !== undefined ? state.answers[i] : null
        )
        const result = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          questions: state.questions,
          answers: finalAnswers,
          markedForReview: state.markedForReview,
          totalTime: state.totalTime,
          quizMeta: state.quizMeta,
        }
        set({ active: false })
        return result
      },

      clear: () =>
        set({
          questions: [],
          answers: [],
          markedForReview: {},
          currentIndex: 0,
          totalTime: 0,
          active: false,
          quizMeta: null,
        }),
    }),
    { name: 'quizmaster-quiz-session' }
  )
)
