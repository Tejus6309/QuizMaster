import { useState, useCallback, Component } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ConfigScreen from './routes/ConfigScreen.jsx'
import QuizScreen from './routes/QuizScreen.jsx'
import ResultScreen from './routes/ResultScreen.jsx'
import HistoryScreen from './routes/HistoryScreen.jsx'
import NotFound from './routes/NotFound.jsx'
import LandingPage from './routes/LandingPage.jsx'
import LoginPage from './routes/LoginPage.jsx'
import RegisterPage from './routes/RegisterPage.jsx'
import DashboardPage from './routes/DashboardPage.jsx'
import GenerateQuizPage from './routes/GenerateQuizPage.jsx'
import MyQuizzesPage from './routes/MyQuizzesPage.jsx'
import ProfilePage from './routes/ProfilePage.jsx'
import AboutPage from './routes/AboutPage.jsx'
import { useQuizStore } from './store/useQuizStore.js'
import { saveAttemptToDB } from './services/attemptService.js'
import { useAuth } from './context/AuthContext.jsx'

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
        <div className="error-boundary-screen">
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
  category: null,
  difficulty: null,
  count: null,
  customQuestions: null,
}

export default function App() {
  const [config, setConfig] = useState(defaultConfig)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const quizStore = useQuizStore()

  const handleStart = useCallback(() => {
    setResult(null)
    navigate('/quiz')
  }, [navigate])

  const handleFinish = useCallback(async (quizResult) => {
    setResult(quizResult)

    // Save attempt to database if user is logged in
    if (user && quizResult) {
      try {
        let correct = 0, incorrect = 0, skipped = 0
        quizResult.questions.forEach((q, i) => {
          const ans = quizResult.answers[i]
          if (ans === undefined || ans === null) skipped++
          else if (q.options[ans]?.isCorrect) correct++
          else incorrect++
        })
        const total = quizResult.questions.length
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
        const accuracy = total - skipped > 0 ? Math.round((correct / (total - skipped)) * 100) : 0

        const categoryName = quizResult.questions[0]?.category || 'Mixed'

        await saveAttemptToDB({
          category_name: typeof categoryName === 'string' && categoryName.length > 0 ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : 'Mixed',
          questions: quizResult.questions,
          answers: quizResult.answers,
          marked_for_review: quizResult.markedForReview,
          total_time: quizResult.totalTime,
          correct,
          incorrect,
          skipped,
          total,
          percentage,
          accuracy,
          source: quizResult.quizMeta?.source || 'static',
        })
      } catch (err) {
        console.error('Failed to save attempt:', err)
      }
    }

    navigate('/result')
  }, [navigate, user])

  const handleRestart = useCallback(() => {
    setResult(null)
    setConfig((prev) => ({ ...prev, customQuestions: null }))
    if (quizStore.active && quizStore.questions.length > 0) {
      quizStore.startQuiz(quizStore.questions, quizStore.quizMeta)
    }
    navigate('/quiz')
  }, [navigate, quizStore])

  const handleHome = useCallback(() => {
    setResult(null)
    setConfig(defaultConfig)
    quizStore.clear()
    navigate('/')
  }, [navigate, quizStore])

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

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={
            <ConfigScreen
              config={config}
              setConfig={setConfig}
              onStart={handleStart}
              onViewHistory={handleViewHistory}
            />
          } />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/generate" element={
            <ProtectedRoute><GenerateQuizPage /></ProtectedRoute>
          } />
          <Route path="/my-quizzes" element={
            <ProtectedRoute><MyQuizzesPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          <Route path="/quiz" element={
            (config.category && config.difficulty) || config.customQuestions || quizStore.active ? (
              quizStore.active ? (
                <QuizScreenFromStore onFinish={handleFinish} />
              ) : (
                <QuizScreen config={config} onFinish={handleFinish} />
              )
            ) : (
              <ConfigScreen
                config={config}
                setConfig={setConfig}
                onStart={handleStart}
                onViewHistory={handleViewHistory}
              />
            )
          } />
          <Route path="/result" element={
            <ResultScreen
              result={result}
              onRestart={handleRestart}
              onHome={handleHome}
              onRetryWrong={handleRetryWrong}
              onViewHistory={handleViewHistory}
            />
          } />
          <Route path="/history" element={<HistoryScreen onHome={handleHome} />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

function QuizScreenFromStore({ onFinish }) {
  // Bridge component that reads from the Zustand store
  const quizStore = useQuizStore()
  const config = {
    category: quizStore.quizMeta?.category || 'Quiz',
    difficulty: quizStore.quizMeta?.difficulty || 'medium',
    count: quizStore.questions.length,
    customQuestions: quizStore.questions,
  }
  return <QuizScreen config={config} onFinish={onFinish} storeMode={quizStore} />
}
