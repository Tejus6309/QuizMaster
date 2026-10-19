import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Brain,
  Trophy,
  Sparkles,
  Flame,
  AlertCircle,
  CheckCircle2,
  GoogleIcon,
  GitHubIcon,
  SupabaseIcon,
  Shield,
  RefreshCw,
} from '../components/icons/Icons.jsx'

export default function AuthScreen({ defaultMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    signIn,
    signUp,
    signInWithOAuth,
    signInAsDemo,
    resetPassword,
    authError,
    setAuthError,
    isConfigured,
  } = useAuth()

  // Determine mode from prop or query param
  const queryParams = new URLSearchParams(location.search)
  const initialMode = queryParams.get('mode') || defaultMode

  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Sync mode if URL route changes between /login and /signup
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
    setFeedback(null)
    setAuthError(null)
  }, [location.pathname, setAuthError])

  // If already logged in, redirect to home or previous state
  useEffect(() => {
    if (user && location.pathname !== '/') {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location.state, location.pathname])

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 1) return { score: 25, label: 'Weak', color: '#ef4444' }
    if (score === 2) return { score: 50, label: 'Fair', color: '#f59e0b' }
    if (score === 3) return { score: 75, label: 'Good', color: '#0ea5e9' }
    return { score: 100, label: 'Strong', color: '#10b981' }
  }, [password])

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    setAuthError(null)

    if (mode === 'forgot') {
      if (!email.trim()) {
        setFeedback({ type: 'error', message: 'Please enter your email address' })
        return
      }
      setIsSubmitting(true)
      const res = await resetPassword(email)
      setIsSubmitting(false)
      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            res.message ||
            'Password reset instructions have been sent to your email address.',
        })
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to send reset link.' })
      }
      return
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setFeedback({ type: 'error', message: 'Please enter your full name.' })
        return
      }
      if (!email.trim()) {
        setFeedback({ type: 'error', message: 'Please enter a valid email.' })
        return
      }
      if (password.length < 6) {
        setFeedback({
          type: 'error',
          message: 'Password must be at least 6 characters.',
        })
        return
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', message: 'Passwords do not match.' })
        return
      }

      setIsSubmitting(true)
      const res = await signUp({ email, password, fullName })
      setIsSubmitting(false)

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Welcome to QuizMaster, ${fullName.trim()}! Logging you in...`,
        })
        setTimeout(() => navigate('/'), 700)
      } else {
        setFeedback({ type: 'error', message: res.error || 'Registration failed.' })
      }
      return
    }

    // Sign In mode
    if (!email.trim() || !password) {
      setFeedback({ type: 'error', message: 'Please enter both email and password.' })
      return
    }

    setIsSubmitting(true)
    const res = await signIn({ email, password })
    setIsSubmitting(false)

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Signed in successfully! Redirecting...',
      })
      setTimeout(() => navigate('/'), 800)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Invalid credentials.' })
    }
  }

  // OAuth Handler
  const handleOAuth = async (provider) => {
    setIsOAuthLoading(provider)
    setFeedback(null)
    const res = await signInWithOAuth(provider)
    setIsOAuthLoading(null)
    if (res.success && res.user) {
      navigate('/')
    } else if (!res.success) {
      setFeedback({ type: 'error', message: res.error || `Could not sign in with ${provider}` })
    }
  }

  // 1-Click Demo Handler
  const handleDemoSignIn = () => {
    signInAsDemo()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side: Brand Showcase & Features */}
        <div className="auth-showcase">
          <div className="auth-showcase__content">
            <Link to="/" className="auth-brand-logo">
              <div className="auth-brand-icon">
                <Brain />
              </div>
              <div className="auth-brand-info">
                <h1 className="auth-brand-title">QuizMaster</h1>
                <span className="auth-brand-tag">Interactive Knowledge Hub</span>
              </div>
            </Link>

            <h2 className="auth-showcase__heading">
              Sharpen your mind with curated questions & tracked progress
            </h2>

            <p className="auth-showcase__lead">
              Create an account or sign in to synchronize quiz records, unlock detailed
              analytics, and compete for top ranks.
            </p>

            {/* Feature Cards */}
            <div className="auth-feature-list">
              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--blue">
                  <Shield />
                </div>
                <div className="auth-feature-card__text">
                  <h4>Cloud Authentication & Sync</h4>
                  <p>Secure PostgreSQL user credentials with JWT sessions and role protection.</p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--amber">
                  <Trophy />
                </div>
                <div className="auth-feature-card__text">
                  <h4>Personal Bests & Streak Records</h4>
                  <p>Automatically preserve your high scores and accuracy metrics across categories.</p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--purple">
                  <Flame />
                </div>
                <div className="auth-feature-card__text">
                  <h4>Tailored Challenges & Review</h4>
                  <p>Retry questions you missed and master topics from Science to Pop Culture.</p>
                </div>
              </div>
            </div>

            {/* Database Badge Footer */}
            <div className="auth-showcase__footer">
              <div className="auth-db-badge">
                <div className="auth-db-badge__dot" />
                <span>Protected by Cloud Authentication & PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="auth-card-wrap">
          <div className="auth-card">
            {/* Mode Switch Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
                onClick={() => {
                  setMode('login')
                  setFeedback(null)
                  setAuthError(null)
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                onClick={() => {
                  setMode('signup')
                  setFeedback(null)
                  setAuthError(null)
                }}
              >
                Create Account
              </button>
            </div>

            {/* Header Titles */}
            <div className="auth-card__header">
              {mode === 'login' && (
                <>
                  <h3 className="auth-card__title">Welcome back</h3>
                  <p className="auth-card__subtitle">
                    Enter your credentials to access your quiz history and personal records.
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <h3 className="auth-card__title">Start your journey</h3>
                  <p className="auth-card__subtitle">
                    Join QuizMaster today to save attempts and unlock personalized stats.
                  </p>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <h3 className="auth-card__title">Reset your password</h3>
                  <p className="auth-card__subtitle">
                    Enter your account email and we'll send you instructions to reset your password.
                  </p>
                </>
              )}
            </div>

            {/* Error or Success Feedback Alert */}
            {(feedback || authError) && (
              <div
                className={`auth-feedback-banner ${
                  feedback?.type === 'success'
                    ? 'auth-feedback-banner--success'
                    : 'auth-feedback-banner--error'
                }`}
              >
                {feedback?.type === 'success' ? (
                  <CheckCircle2 className="auth-feedback-icon" />
                ) : (
                  <AlertCircle className="auth-feedback-icon" />
                )}
                <span>{feedback?.message || authError}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-fullname">
                    Full Name
                  </label>
                  <div className="auth-input-box">
                    <User className="auth-input-icon" />
                    <input
                      id="auth-fullname"
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Alex Hunter"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">
                  Email Address
                </label>
                <div className="auth-input-box">
                  <Mail className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div className="auth-field">
                  <div className="auth-field-header">
                    <label className="auth-label" htmlFor="auth-password">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => {
                          setMode('forgot')
                          setFeedback(null)
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-box">
                    <Lock className="auth-input-icon" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder={mode === 'signup' ? 'Create a secure password' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  {/* Password Strength Meter (Sign Up only) */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="password-meter">
                      <div className="password-meter__bar">
                        <div
                          className="password-meter__fill"
                          style={{
                            width: `${passwordStrength.score}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                      <span
                        className="password-meter__label"
                        style={{ color: passwordStrength.color }}
                      >
                        Strength: {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (Sign Up only) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm-pwd">
                    Confirm Password
                  </label>
                  <div className="auth-input-box">
                    <Lock className="auth-input-icon" />
                    <input
                      id="auth-confirm-pwd"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-toggle-pwd"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox (Sign In only) */}
              {mode === 'login' && (
                <div className="auth-remember-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    <span>Remember my session</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading-content">
                    <RefreshCw className="spin-icon" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="btn-text-content">
                    {mode === 'login' && 'Sign In to QuizMaster'}
                    {mode === 'signup' && 'Create Your Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    <ArrowRight className="btn-arrow-icon" />
                  </span>
                )}
              </button>

              {/* Back to sign in if in forgot mode */}
              {mode === 'forgot' && (
                <button
                  type="button"
                  className="auth-back-link"
                  onClick={() => {
                    setMode('login')
                    setFeedback(null)
                  }}
                >
                  &larr; Back to Sign In
                </button>
              )}
            </form>

            {/* Social Authentication */}
            {mode !== 'forgot' && (
              <>
                <div className="auth-divider">
                  <span>or continue with</span>
                </div>

                <div className="auth-social-row">
                  <button
                    type="button"
                    className="auth-social-btn"
                    onClick={() => handleOAuth('google')}
                    disabled={isOAuthLoading !== null}
                  >
                    <GoogleIcon className="social-icon" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    className="auth-social-btn"
                    onClick={() => handleOAuth('github')}
                    disabled={isOAuthLoading !== null}
                  >
                    <GitHubIcon className="social-icon" />
                    <span>GitHub</span>
                  </button>
                </div>

                {/* 1-Click Instant Demo Login Option */}
                <div className="auth-demo-box">
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={handleDemoSignIn}
                  >
                    <Sparkles className="demo-icon" />
                    <span>Instant Preview (1-Click Demo Account)</span>
                  </button>
                  <p className="auth-demo-hint">
                    Explore all stats, profiles, and quiz challenges without creating an account.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
