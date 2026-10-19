import { create } from 'zustand'
import { getActiveUserIdentifier } from '../utils/storage.js'

const getStorageKey = (key, userId = null) => {
  const uid = getActiveUserIdentifier(userId)
  return `quizmaster_${key}_${uid}`
}

const loadFromStorage = (key, fallback = [], userId = null) => {
  try {
    const raw = localStorage.getItem(getStorageKey(key, userId))
    return raw ? JSON.parse(raw) : fallback
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err)
    return fallback
  }
}

const saveToStorage = (key, value, userId = null) => {
  try {
    localStorage.setItem(getStorageKey(key, userId), JSON.stringify(value))
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err)
  }
}

/**
 * Zustand Store for Global State Architecture:
 * - Study Cart (Shopping cart pattern for bookmarked questions)
 * - Custom Questions CRUD workflow
 * - Online REST API vs Local Curated Bank configuration
 */
export const useQuizStore = create((set, get) => ({
  // 1. Study Cart / Bookmarked Questions (Shopping Cart Pattern)
  studyCart: loadFromStorage('study_cart', []),

  // Reload store when user changes
  initUserSession: (userId) => {
    set({
      studyCart: loadFromStorage('study_cart', [], userId),
      customQuestions: loadFromStorage('custom_questions', [], userId),
    })
  },

  addToCart: (question) => {
    if (!question || !question.id) return false
    const current = get().studyCart
    if (current.some((q) => q.id === question.id)) {
      return false // Already in cart
    }
    const updated = [question, ...current]
    set({ studyCart: updated })
    saveToStorage('study_cart', updated)
    return true
  },

  removeFromCart: (questionId) => {
    const updated = get().studyCart.filter((q) => q.id !== questionId)
    set({ studyCart: updated })
    saveToStorage('study_cart', updated)
  },

  clearCart: () => {
    set({ studyCart: [] })
    saveToStorage('study_cart', [])
  },

  isInCart: (questionId) => {
    return get().studyCart.some((q) => q.id === questionId)
  },

  // 2. Custom Questions CRUD Workflows
  customQuestions: loadFromStorage('custom_questions', []),

  addCustomQuestion: (question) => {
    const newQuestion = {
      ...question,
      id: question.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isCustom: true,
    }
    const updated = [newQuestion, ...get().customQuestions]
    set({ customQuestions: updated })
    saveToStorage('custom_questions', updated)
    return newQuestion
  },

  updateCustomQuestion: (id, updatedFields) => {
    const updated = get().customQuestions.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        }
      }
      return q
    })
    set({ customQuestions: updated })
    saveToStorage('custom_questions', updated)
  },

  deleteCustomQuestion: (id) => {
    const updated = get().customQuestions.filter((q) => q.id !== id)
    set({ customQuestions: updated })
    saveToStorage('custom_questions', updated)
  },

  // 3. Quiz Mode and Third-Party REST API Configuration
  apiConfig: {
    source: 'local', // 'local' | 'opentdb'
    openTdbCategory: 'all',
    openTdbDifficulty: 'all',
    openTdbAmount: 10,
  },

  setQuizSource: (source) => {
    set((state) => ({
      apiConfig: {
        ...state.apiConfig,
        source,
      },
    }))
  },

  setApiConfig: (partial) => {
    set((state) => ({
      apiConfig: {
        ...state.apiConfig,
        ...partial,
      },
    }))
  },
}))
