import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
import { uploadDocumentToDB, deleteDocumentDB } from '../services/documentService.js'
import { saveQuizToDB } from '../services/quizService.js'
import FileDropzone from '../components/ui/FileDropzone.jsx'
import RadioGroup from '../components/ui/RadioGroup.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { supabase } from '../services/supabaseClient.js'
import { Upload, Sparkles, ArrowRight, Trash2, Edit, RefreshCw, PlayCircle, AlertCircle } from '../components/icons/ExtraIcons.jsx'

const difficultyOptions = [
  { value: 'easy', label: 'Easy', desc: 'Direct recall' },
  { value: 'medium', label: 'Medium', desc: 'Understanding' },
  { value: 'hard', label: 'Hard', desc: 'Multi-step reasoning' },
  { value: 'mixed', label: 'Mixed', desc: 'All levels' },
]

const countOptions = [5, 10, 15, 20, 25]

const loadingMessages = [
  'Reading document...',
  'Analyzing content...',
  'Generating questions...',
  'Validating answers...',
  'Almost done...',
]

export default function GenerateQuizPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const [file, setFile] = useState(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [questionType, setQuestionType] = useState('mcq')
  const [timerPerQuestion, setTimerPerQuestion] = useState(20)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const handleFileSelected = useCallback((f) => {
    setFile(f)
    setError('')
  }, [])

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload a document first')
      return
    }

    setLoading(true)
    setError('')
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingMessages.length - 1))
    }, 2000)

    try {
      // Step 1: Parse file content
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      let textContent = ''

      if (fileExt === 'txt' || fileExt === 'md') {
        textContent = await file.text()
      } else {
        // For PDF/DOCX, send to edge function for parsing
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', fileExt)

        const parseResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: formData,
          }
        )

        if (!parseResponse.ok) {
          const errData = await parseResponse.json().catch(() => ({}))
          throw new Error(errData.error || 'Could not read this file. It may be a scanned PDF or image-only file.')
        }

        const parsed = await parseResponse.json()
        textContent = parsed.text || ''
      }

      if (!textContent || textContent.trim().length < 50) {
        throw new Error('This document has no readable text or is too short. Try a different file.')
      }

      setLoadingStep(2)

      // Step 2: Save document to DB
      const docRecord = await uploadDocumentToDB({
        title: file.name,
        content: textContent.slice(0, 50000),
        file_type: fileExt,
        file_size: file.size,
        char_count: textContent.length,
      })

      setLoadingStep(3)

      // Step 3: Generate quiz via edge function
      const genResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            documentId: docRecord.id,
            text: textContent.slice(0, 50000),
            numQuestions,
            difficulty,
            questionType,
          }),
        }
      )

      if (!genResponse.ok) {
        const errData = await genResponse.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate quiz. Please try again.')
      }

      const genData = await genResponse.json()
      const questions = genData.questions || []

      if (questions.length === 0) {
        throw new Error('No questions could be generated from this document. Try a longer or more detailed file.')
      }

      // Map to app format
      const mappedQuestions = questions.map((q, i) => ({
        id: `gen_${i + 1}`,
        category: 'Uploaded Document',
        difficulty: difficulty === 'mixed' ? 'medium' : difficulty,
        question: q.question,
        options: q.options.map((opt, oi) => ({
          opt,
          isCorrect: oi === q.answerIndex,
        })),
        correctIndex: q.answerIndex,
        explanation: q.explanation || '',
      }))

      setLoadingStep(4)

      // Save quiz to DB
      const quizRecord = await saveQuizToDB({
        document_id: docRecord.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        questions: mappedQuestions,
        difficulty,
        num_questions: mappedQuestions.length,
        source: 'document',
      })

      setGeneratedQuestions({ questions: mappedQuestions, quizId: quizRecord.id, docId: docRecord.id })
      setShowPreview(true)
      toast(`${mappedQuestions.length} questions generated!`, 'success')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      toast('Generation failed', 'error')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    if (!generatedQuestions) return
    startQuiz(generatedQuestions.questions, {
      source: 'document',
      quizId: generatedQuestions.quizId,
      category: 'Uploaded Document',
      difficulty,
    })
    setShowPreview(false)
    navigate('/quiz')
  }

  const handleDeleteQuestion = (index) => {
    const updated = generatedQuestions.questions.filter((_, i) => i !== index)
    setGeneratedQuestions({ ...generatedQuestions, questions: updated })
  }

  const handleEditQuestion = (index) => {
    const q = generatedQuestions.questions[index]
    setEditingIndex(index)
    setEditForm({
      question: q.question,
      options: q.options.map((o) => o.opt),
      correctIndex: q.options.findIndex((o) => o.isCorrect),
      explanation: q.explanation,
    })
  }

  const handleSaveEdit = () => {
    if (editingIndex === null || !editForm) return
    const updated = [...generatedQuestions.questions]
    updated[editingIndex] = {
      ...updated[editingIndex],
      question: editForm.question,
      options: editForm.options.map((opt, oi) => ({
        opt,
        isCorrect: oi === editForm.correctIndex,
      })),
      correctIndex: editForm.correctIndex,
      explanation: editForm.explanation,
    }
    setGeneratedQuestions({ ...generatedQuestions, questions: updated })
    setEditingIndex(null)
    setEditForm(null)
    toast('Question updated', 'success')
  }

  return (
    <div className="generate-page">
      <div className="generate-page__header">
        <h1 className="generate-page__title">
          <Sparkles className="generate-page__title-icon" />
          Generate Quiz from Document
        </h1>
        <p className="generate-page__subtitle">
          Upload a document and let AI create a custom quiz for you
        </p>
      </div>

      <div className="generate-page__layout">
        <div className="generate-page__main">
          <div className="generate-section">
            <h3 className="generate-section__label">1. Upload Document</h3>
            <FileDropzone onFileSelected={handleFileSelected} error={error} />
          </div>

          <div className="generate-section">
            <h3 className="generate-section__label">2. Number of Questions</h3>
            <div className="generate-counts">
              {countOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`count-chip ${numQuestions === n ? 'count-chip--active' : ''}`}
                  onClick={() => setNumQuestions(n)}
                >
                  <span className="count-chip__num">{n}</span>
                  <span className="count-chip__label">Questions</span>
                </button>
              ))}
            </div>
          </div>

          <div className="generate-section">
            <h3 className="generate-section__label">3. Difficulty</h3>
            <RadioGroup
              options={difficultyOptions}
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>

          <div className="generate-section">
            <h3 className="generate-section__label">4. Timer per Question</h3>
            <div className="generate-timers">
              {[
                { val: 0, label: 'Off' },
                { val: 10, label: '10s' },
                { val: 20, label: '20s' },
                { val: 30, label: '30s' },
                { val: 60, label: '60s' },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  className={`timer-chip ${timerPerQuestion === t.val ? 'timer-chip--active' : ''}`}
                  onClick={() => setTimerPerQuestion(t.val)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="generate-error">
              <AlertCircle className="generate-error__icon" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleGenerate}
            disabled={!file}
            className="generate-page__submit"
          >
            <Sparkles /> Generate Quiz
          </Button>
        </div>

        <aside className="generate-page__sidebar">
          <div className="generate-info-card">
            <h4>How it works</h4>
            <ol>
              <li>Upload a PDF, DOCX, TXT, or MD file</li>
              <li>Choose how many questions and the difficulty</li>
              <li>AI reads your document and generates questions</li>
              <li>Preview, edit, or delete generated questions</li>
              <li>Start the quiz with full timer and review features</li>
            </ol>
          </div>
          <div className="generate-info-card generate-info-card--tip">
            <h4>Tips</h4>
            <ul>
              <li>Use text-based PDFs (not scanned images)</li>
              <li>Longer documents produce better questions</li>
              <li>For short docs, try fewer questions</li>
            </ul>
          </div>
        </aside>
      </div>

      {loading && (
        <div className="generate-loading-overlay">
          <div className="generate-loading-card">
            <Spinner size="lg" />
            <p className="generate-loading-text">{loadingMessages[loadingStep]}</p>
            <div className="generate-loading-bar">
              <div
                className="generate-loading-bar__fill"
                style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <Modal open={showPreview && !loading} onClose={() => setShowPreview(false)} title="Quiz Preview" maxWidth={680}>
        {generatedQuestions && (
          <div className="preview-modal">
            <p className="preview-modal__count">
              {generatedQuestions.questions.length} questions generated
            </p>
            <div className="preview-modal__list">
              {generatedQuestions.questions.map((q, i) => (
                <div key={i} className="preview-question">
                  <div className="preview-question__header">
                    <span className="preview-question__num">Q{i + 1}</span>
                    <p className="preview-question__text">{q.question}</p>
                  </div>
                  <div className="preview-question__options">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`preview-option ${opt.isCorrect ? 'preview-option--correct' : ''}`}
                      >
                        <span className="preview-option__letter">{String.fromCharCode(65 + oi)}</span>
                        <span>{opt.opt}</span>
                        {opt.isCorrect && <span className="preview-option__badge">Correct</span>}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="preview-question__explanation">{q.explanation}</p>
                  )}
                  <div className="preview-question__actions">
                    <button type="button" className="btn-icon-text" onClick={() => handleEditQuestion(i)}>
                      <Edit /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn-icon-text btn-icon-text--danger"
                      onClick={() => handleDeleteQuestion(i)}
                    >
                      <Trash2 /> Delete
                    </button>
                  </div>

                  {editingIndex === i && editForm && (
                    <div className="preview-edit-form">
                      <input
                        className="ui-input"
                        value={editForm.question}
                        onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                        placeholder="Question text"
                      />
                      {editForm.options.map((opt, oi) => (
                        <div key={oi} className="preview-edit-option">
                          <input
                            className="ui-input"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...editForm.options]
                              opts[oi] = e.target.value
                              setEditForm({ ...editForm, options: opts })
                            }}
                          />
                          <label className="preview-edit-radio">
                            <input
                              type="radio"
                              name={`correct-${i}`}
                              checked={editForm.correctIndex === oi}
                              onChange={() => setEditForm({ ...editForm, correctIndex: oi })}
                            />
                            Correct
                          </label>
                        </div>
                      ))}
                      <textarea
                        className="ui-input"
                        value={editForm.explanation}
                        onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                        placeholder="Explanation"
                        rows={2}
                      />
                      <div className="preview-edit-actions">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingIndex(null); setEditForm(null) }}>Cancel</Button>
                        <Button size="sm" variant="primary" onClick={handleSaveEdit}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="preview-modal__footer">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>Back</Button>
              <Button variant="primary" onClick={handleStartQuiz}>
                <PlayCircle /> Start Quiz
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
