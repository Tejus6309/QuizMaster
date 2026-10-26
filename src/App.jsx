import { useState, useCallback, Component, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ConfigScreen from './routes/ConfigScreen.jsx'
import QuizScreen from './routes/QuizScreen.jsx'
import ResultScreen from './routes/ResultScreen.jsx'
import HistoryScreen from './routes/HistoryScreen.jsx'
import AuthScreen from './routes/AuthScreen.jsx'
import ProfileScreen from './routes/ProfileScreen.jsx'
import DashboardScreen from './routes/DashboardScreen.jsx'
import StudyDeckScreen from './routes/StudyDeckScreen.jsx'
import NotFound from './routes/NotFound.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useQuizStore } from './store/useQuizStore.js'
import { Brain } from './components/icons/Icons.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('QuizApp ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#64748b', margin: '12px 0 24px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn--primary"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}
          >
            Return to Start
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const defaultConfig = {
  category: 'all',
  difficulty: 'all',
  count: 10,
  customQuestions: null,
}

export default function App() {
  const { user, loading } = useAuth()
  const { initUserSession } = useQuizStore()
  const [config, setConfig] = useState(defaultConfig)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  // Sync user scoped storage in Zustand on auth change
  useEffect(() => {
    initUserSession(user?.id)
  }, [user, initUserSession])

  const handleStart = useCallback(() => {
    setResult(null)
    navigate('/quiz')
  }, [navigate])

  const handleFinish = useCallback((quizResult) => {
    setResult(quizResult)
    navigate('/result')
  }, [navigate])

  const handleRestart = useCallback(() => {
    setResult(null)
    setConfig((prev) => ({ ...prev, customQuestions: null }))
    navigate('/quiz')
  }, [navigate])

  const handleHome = useCallback(() => {
    setResult(null)
    setConfig(defaultConfig)
    navigate('/')
  }, [navigate])

  const handleViewHistory = useCallback(() => {
    navigate('/history')
  }, [navigate])

  const handleRetryWrong = useCallback((wrongQuestions) => {
    if (!wrongQuestions || wrongQuestions.length === 0) return
    setResult(null)
    setConfig((prev) => ({
      ...prev,
      category: prev.category || 'all',
      difficulty: prev.difficulty || 'all',
      count: wrongQuestions.length,
      customQuestions: wrongQuestions,
    }))
    navigate('/quiz')
  }, [navigate])

  const handleStartCustomQuiz = useCallback((customQuestionsList, categoryTitle = 'Custom Deck') => {
    if (!customQuestionsList || customQuestionsList.length === 0) return
    setResult(null)
    setConfig({
      category: categoryTitle,
      difficulty: 'mixed',
      count: customQuestionsList.length,
      customQuestions: customQuestionsList,
    })
    navigate('/quiz')
  }, [navigate])

  if (loading) {
    return (
      <div
        className="app"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: '18px',
        }}
      >
        <div className="qm-navbar__logo-icon" style={{ width: '48px', height: '48px' }}>
          <Brain />
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading QuizMaster...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <ConfigScreen
                  config={config}
                  setConfig={setConfig}
                  onStart={handleStart}
                  onViewHistory={handleViewHistory}
                  onStartCustomQuiz={handleStartCustomQuiz}
                />
              ) : (
                <AuthScreen defaultMode="signup" />
              )
            }
          />
          <Route
            path="/quiz"
            element={
              user ? (
                (config.category && config.difficulty) || config.customQuestions ? (
                  <QuizScreen config={config} onFinish={handleFinish} />
                ) : (
                  <ConfigScreen
                    config={config}
                    setConfig={setConfig}
                    onStart={handleStart}
                    onViewHistory={handleViewHistory}
                    onStartCustomQuiz={handleStartCustomQuiz}
                  />
                )
              ) : (
                <AuthScreen defaultMode="login" />
              )
            }
          />
          <Route
            path="/result"
            element={
              user ? (
                <ResultScreen
                  result={result}
                  config={config}
                  onRestart={handleRestart}
                  onHome={handleHome}
                  onRetryWrong={handleRetryWrong}
                  onViewHistory={handleViewHistory}
                />
              ) : (
                <AuthScreen defaultMode="login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <DashboardScreen onStartCustomQuiz={handleStartCustomQuiz} />
              ) : (
                <AuthScreen defaultMode="login" />
              )
            }
          />
          <Route
            path="/deck"
            element={
              user ? (
                <StudyDeckScreen onStartCustomQuiz={handleStartCustomQuiz} />
              ) : (
                <AuthScreen defaultMode="login" />
              )
            }
          />
          <Route
            path="/history"
            element={
              user ? <HistoryScreen onHome={handleHome} /> : <AuthScreen defaultMode="login" />
            }
          />
          <Route
            path="/login"
            element={<AuthScreen defaultMode="login" />}
          />
          <Route
            path="/signup"
            element={<AuthScreen defaultMode="signup" />}
          />
          <Route
            path="/auth"
            element={<AuthScreen defaultMode="signup" />}
          />
          <Route
            path="/profile"
            element={
              user ? <ProfileScreen /> : <AuthScreen defaultMode="login" />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}
