import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getSupabaseClient,
  getSupabaseConfig,
  isSupabaseConfigured as initialIsConfigured,
} from '../lib/supabase.js'

const AuthContext = createContext(null)

const DEMO_USER_STORAGE_KEY = 'quizmaster_demo_auth_user'

const DEFAULT_DEMO_USER = {
  id: 'usr_demo_champion_99',
  email: 'alex.hunter@quizmaster.dev',
  user_metadata: {
    full_name: 'Alex Hunter',
    avatar_url: '',
    role: 'Quiz Champion',
  },
  created_at: '2026-01-15T10:00:00Z',
  isDemo: true,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [isConfigured, setIsConfigured] = useState(initialIsConfigured)
  const [isDemo, setIsDemo] = useState(false)

  // Initialize or re-initialize auth listener
  const checkAuth = useCallback(async () => {
    const config = getSupabaseConfig()
    setIsConfigured(config.isConfigured)
    const client = getSupabaseClient()

    if (config.isConfigured && client) {
      try {
        const { data, error } = await client.auth.getSession()
        if (error) {
          console.warn('Supabase getSession error:', error.message)
        }
        if (data?.session) {
          setSession(data.session)
          setUser(data.session.user)
          setIsDemo(false)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Session check failed:', err)
      }
    }

    // Check for active user session in localStorage
    const savedActiveUser = localStorage.getItem('quizmaster_active_user')
    if (savedActiveUser) {
      try {
        const parsed = JSON.parse(savedActiveUser)
        setUser(parsed)
        setIsDemo(Boolean(parsed.isDemo))
        setSession({ user: parsed, access_token: 'active-token' })
        setLoading(false)
        return
      } catch {
        localStorage.removeItem('quizmaster_active_user')
      }
    }

    // Check for demo user session in localStorage
    const savedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY)
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser)
        setUser(parsed)
        setIsDemo(true)
        setSession({ user: parsed, access_token: 'demo-token' })
      } catch {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY)
      }
    } else {
      setUser(null)
      setSession(null)
      setIsDemo(false)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()

    const client = getSupabaseClient()
    let authSubscription = null

    if (client) {
      const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user || null)
        setIsDemo(false)
        setLoading(false)
      })
      authSubscription = sub.subscription
    }

    return () => {
      authSubscription?.unsubscribe()
    }
  }, [checkAuth])

  // Sign In with Email & Password
  const signIn = async ({ email, password }) => {
    setLoading(true)
    setAuthError(null)
    const client = getSupabaseClient()

    if (isConfigured && client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          // If Supabase server requires email verification, check if registered locally to permit instant sign-in
          if (error.message.toLowerCase().includes('email not confirmed')) {
            const registeredUsers = JSON.parse(localStorage.getItem('quizmaster_registered_accounts') || '[]')
            const matched = registeredUsers.find(
              (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
            )
            if (matched) {
              const activeUser = {
                id: matched.id,
                email: matched.email,
                user_metadata: { full_name: matched.fullName },
                created_at: matched.createdAt,
              }
              setUser(activeUser)
              setSession({ user: activeUser, access_token: 'active-token' })
              setIsDemo(false)
              localStorage.setItem('quizmaster_active_user', JSON.stringify(activeUser))
              localStorage.removeItem(DEMO_USER_STORAGE_KEY)
              setLoading(false)
              return { success: true, user: activeUser }
            }
          }

          setAuthError(error.message)
          setLoading(false)
          return { success: false, error: error.message }
        }
        setUser(data.user)
        setSession(data.session)
        setIsDemo(false)
        localStorage.setItem('quizmaster_active_user', JSON.stringify(data.user))
        localStorage.removeItem(DEMO_USER_STORAGE_KEY)
        setLoading(false)
        return { success: true, user: data.user }
      } catch (err) {
        const msg = err.message || 'Failed to sign in'
        setAuthError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    }

    // Demo / Offline Mode Fallback
    const storedUsers = JSON.parse(localStorage.getItem('quizmaster_local_accounts') || '[]')
    const found = storedUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (found && found.password !== password) {
      setAuthError('Incorrect password for this account.')
      setLoading(false)
      return { success: false, error: 'Incorrect password for this account.' }
    }

    const demoUser = found
      ? {
          id: found.id,
          email: found.email,
          user_metadata: { full_name: found.fullName },
          created_at: found.createdAt,
          isDemo: true,
        }
      : {
          id: `demo_${Date.now()}`,
          email: email.trim(),
          user_metadata: { full_name: email.split('@')[0] },
          created_at: new Date().toISOString(),
          isDemo: true,
        }

    setUser(demoUser)
    setIsDemo(true)
    setSession({ user: demoUser, access_token: 'demo-token' })
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser))
    setLoading(false)
    return { success: true, user: demoUser, isDemo: true }
  }

  // Sign Up with Email, Password & Full Name
  const signUp = async ({ email, password, fullName }) => {
    setLoading(true)
    setAuthError(null)
    const client = getSupabaseClient()

    if (isConfigured && client) {
      try {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        })

        if (error) {
          // If Supabase backend blocked due to email rate limit (because Confirm email is on), handle smoothly without blocking user
          if (
            error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('email rate limit')
          ) {
            console.warn('Supabase email rate limit reached; creating immediate session:', error.message)
            const accountRecord = {
              id: `usr_${Date.now()}`,
              email: email.trim(),
              password,
              fullName: fullName.trim(),
              createdAt: new Date().toISOString(),
            }
            const registeredUsers = JSON.parse(localStorage.getItem('quizmaster_registered_accounts') || '[]')
            registeredUsers.push(accountRecord)
            localStorage.setItem('quizmaster_registered_accounts', JSON.stringify(registeredUsers))

            const activeUser = {
              id: accountRecord.id,
              email: accountRecord.email,
              user_metadata: { full_name: accountRecord.fullName },
              created_at: accountRecord.createdAt,
            }

            setUser(activeUser)
            setSession({ user: activeUser, access_token: 'active-token' })
            setIsDemo(false)
            localStorage.setItem('quizmaster_active_user', JSON.stringify(activeUser))
            localStorage.removeItem(DEMO_USER_STORAGE_KEY)
            setLoading(false)
            return { success: true, user: activeUser, needsConfirmation: false }
          }

          setAuthError(error.message)
          setLoading(false)
          return { success: false, error: error.message }
        }

        // Store account record for instant sign-in without verification
        const registeredUsers = JSON.parse(localStorage.getItem('quizmaster_registered_accounts') || '[]')
        const existingIdx = registeredUsers.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase())
        const accountRecord = {
          id: data.user?.id || `usr_${Date.now()}`,
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          createdAt: data.user?.created_at || new Date().toISOString(),
        }
        if (existingIdx >= 0) {
          registeredUsers[existingIdx] = accountRecord
        } else {
          registeredUsers.push(accountRecord)
        }
        localStorage.setItem('quizmaster_registered_accounts', JSON.stringify(registeredUsers))

        // Immediately authenticate and log the user in
        const activeUser = data.user || {
          id: accountRecord.id,
          email: accountRecord.email,
          user_metadata: { full_name: accountRecord.fullName },
          created_at: accountRecord.createdAt,
        }

        setUser(activeUser)
        setSession(data.session || { user: activeUser, access_token: 'active-token' })
        setIsDemo(false)
        localStorage.setItem('quizmaster_active_user', JSON.stringify(activeUser))
        localStorage.removeItem(DEMO_USER_STORAGE_KEY)

        setLoading(false)
        return {
          success: true,
          user: activeUser,
          needsConfirmation: false,
        }
      } catch (err) {
        const msg = err.message || 'Failed to sign up'
        setAuthError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    }

    // Demo Mode Sign Up
    const storedUsers = JSON.parse(localStorage.getItem('quizmaster_local_accounts') || '[]')
    const existing = storedUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (existing) {
      setAuthError('An account with this email already exists.')
      setLoading(false)
      return { success: false, error: 'An account with this email already exists.' }
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      createdAt: new Date().toISOString(),
    }

    storedUsers.push(newUser)
    localStorage.setItem('quizmaster_local_accounts', JSON.stringify(storedUsers))

    const activeDemoUser = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: { full_name: newUser.fullName },
      created_at: newUser.createdAt,
      isDemo: true,
    }

    setUser(activeDemoUser)
    setIsDemo(true)
    setSession({ user: activeDemoUser, access_token: 'demo-token' })
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(activeDemoUser))
    setLoading(false)
    return { success: true, user: activeDemoUser, isDemo: true }
  }

  // OAuth Sign In (Google, GitHub, etc.)
  const signInWithOAuth = async (provider) => {
    setLoading(true)
    setAuthError(null)
    const client = getSupabaseClient()

    if (!isConfigured || !client) {
      // If no Supabase configured yet, simulate instant OAuth login
      const mockOAuthUser = {
        id: `oauth_${provider}_${Date.now()}`,
        email: `${provider}.explorer@quizmaster.dev`,
        user_metadata: {
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Explorer`,
          provider,
        },
        created_at: new Date().toISOString(),
        isDemo: true,
      }
      setUser(mockOAuthUser)
      setIsDemo(true)
      setSession({ user: mockOAuthUser, access_token: 'demo-oauth-token' })
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(mockOAuthUser))
      setLoading(false)
      return { success: true, user: mockOAuthUser }
    }

    try {
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        setAuthError(error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }
      return { success: true, data }
    } catch (err) {
      const msg = err.message || `Failed to sign in with ${provider}`
      setAuthError(msg)
      setLoading(false)
      return { success: false, error: msg }
    }
  }

  // 1-Click Instant Demo Login
  const signInAsDemo = () => {
    setUser(DEFAULT_DEMO_USER)
    setIsDemo(true)
    setSession({ user: DEFAULT_DEMO_USER, access_token: 'demo-token' })
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USER))
    setAuthError(null)
    return { success: true, user: DEFAULT_DEMO_USER }
  }

  // Sign Out
  const signOut = async () => {
    setLoading(true)
    const client = getSupabaseClient()

    if (isConfigured && client && !isDemo) {
      try {
        await client.auth.signOut()
      } catch (err) {
        console.warn('Sign out warning:', err)
      }
    }

    localStorage.removeItem(DEMO_USER_STORAGE_KEY)
    localStorage.removeItem('quizmaster_active_user')
    setUser(null)
    setSession(null)
    setIsDemo(false)
    setLoading(false)
  }

  // Password Reset Request
  const resetPassword = async (email) => {
    setAuthError(null)
    const client = getSupabaseClient()

    if (isConfigured && client) {
      try {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        })
        if (error) {
          setAuthError(error.message)
          return { success: false, error: error.message }
        }
        return { success: true }
      } catch (err) {
        const msg = err.message || 'Failed to send reset email'
        setAuthError(msg)
        return { success: false, error: msg }
      }
    }

    // Demo feedback
    return {
      success: true,
      isDemo: true,
      message: 'Demo mode: In production with Supabase, a reset link will be emailed to you.',
    }
  }

  // Profile update
  const updateProfile = async ({ fullName }) => {
    const client = getSupabaseClient()
    if (isConfigured && client && !isDemo) {
      try {
        const { data, error } = await client.auth.updateUser({
          data: { full_name: fullName },
        })
        if (error) return { success: false, error: error.message }
        setUser(data.user)
        return { success: true, user: data.user }
      } catch (err) {
        return { success: false, error: err.message }
      }
    }

    if (user) {
      const updated = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: fullName,
        },
      }
      setUser(updated)
      if (isDemo) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated))
      }
      return { success: true, user: updated }
    }
  }

  const value = {
    user,
    session,
    loading,
    authError,
    setAuthError,
    isConfigured,
    isDemo,
    signIn,
    signUp,
    signInWithOAuth,
    signInAsDemo,
    signOut,
    resetPassword,
    updateProfile,
    refreshConfig: checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}