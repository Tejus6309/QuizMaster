import { useState, useCallback, Component } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ConfigScreen from './routes/ConfigScreen.jsx'
import QuizScreen from './routes/QuizScreen.jsx'
import ResultScreen from './routes/ResultScreen.jsx'
import HistoryScreen from './routes/HistoryScreen.jsx'
import NotFound from './routes/NotFound.jsx'

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
  category: null,
  difficulty: null,
  count: null,
  customQuestions: null,
}

export default function App() {
  const [config, setConfig] = useState(defaultConfig)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

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

  return (
    <div className="app">
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <ConfigScreen
                config={config}
                setConfig={setConfig}
                onStart={handleStart}
                onViewHistory={handleViewHistory}
              />
            }
          />
          <Route
            path="/quiz"
            element={
              (config.category && config.difficulty) || config.customQuestions ? (
                <QuizScreen config={config} onFinish={handleFinish} />
              ) : (
                <ConfigScreen
                  config={config}
                  setConfig={setConfig}
                  onStart={handleStart}
                  onViewHistory={handleViewHistory}
                />
              )
            }
          />
          <Route
            path="/result"
            element={
              <ResultScreen
                result={result}
                onRestart={handleRestart}
                onHome={handleHome}
                onRetryWrong={handleRetryWrong}
                onViewHistory={handleViewHistory}
              />
            }
          />
          <Route
            path="/history"
            element={<HistoryScreen onHome={handleHome} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}


