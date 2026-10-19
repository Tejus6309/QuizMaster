import { useState, useEffect } from 'react'
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase.js'
import {
  X,
  CheckCircle2,
  AlertCircle,
  SupabaseIcon,
  RefreshCw,
  Shield,
} from './icons/Icons.jsx'

export default function SupabaseModal({ isOpen, onClose }) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showSql, setShowSql] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig()
      setUrl(config.url || '')
      setAnonKey(config.anonKey || '')
      setTestResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTest = async () => {
    if (!url || !anonKey) {
      setTestResult({
        success: false,
        message: 'Please provide both Project URL and Anon Key to test.',
      })
      return
    }
    setTesting(true)
    setTestResult(null)
    const res = await testSupabaseConnection(url, anonKey)
    setTesting(false)
    setTestResult(res)
  }

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert('Please enter both Supabase URL and Anon Key')
      return
    }
    saveSupabaseConfig(url.trim(), anonKey.trim())
    onClose()
  }

  const handleReset = () => {
    if (window.confirm('Reset to default environment configuration?')) {
      clearSupabaseConfig()
      const config = getSupabaseConfig()
      setUrl(config.url || '')
      setAnonKey(config.anonKey || '')
      setTestResult(null)
    }
  }

  const sqlSchema = `-- Run this in your Supabase SQL Editor to store quiz results:
create table if not exists public.quiz_results (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_email text,
  category text,
  difficulty text,
  score integer,
  total_questions integer,
  percentage integer,
  accuracy integer,
  total_time integer,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.quiz_results enable row level security;

-- Allow users to view and insert their own results
create policy "Users can view own results" on public.quiz_results
  for select using (auth.uid() = user_id);

create policy "Users can insert own results" on public.quiz_results
  for insert with check (auth.uid() = user_id);`

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  const currentConfig = getSupabaseConfig()

  return (
    <div className="supabase-modal-backdrop" onClick={onClose}>
      <div className="supabase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="supabase-modal__header">
          <div className="supabase-modal__title-row">
            <div className="supabase-modal__icon-wrap">
              <SupabaseIcon className="supabase-modal__icon" />
            </div>
            <div>
              <h2 className="supabase-modal__title">Supabase Cloud Integration</h2>
              <p className="supabase-modal__subtitle">
                Configure PostgreSQL authentication and cloud database
              </p>
            </div>
          </div>
          <button
            type="button"
            className="supabase-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X />
          </button>
        </div>

        <div className="supabase-modal__body">
          {/* Status Indicator */}
          <div
            className={`supabase-status-banner ${
              currentConfig.isConfigured
                ? 'supabase-status-banner--connected'
                : 'supabase-status-banner--demo'
            }`}
          >
            <div className="supabase-status-banner__dot" />
            <div className="supabase-status-banner__text">
              <strong>
                {currentConfig.isConfigured
                  ? 'Supabase Cloud Connected'
                  : 'Running in Local / Demo Auth Mode'}
              </strong>
              <span>
                {currentConfig.isConfigured
                  ? 'Real-time Supabase Auth & JWT sessions are active.'
                  : 'You can test all login/signup features instantly or connect your Supabase project below.'}
              </span>
            </div>
          </div>

          <div className="supabase-form-group">
            <label className="supabase-label">
              Supabase Project URL
              <span className="supabase-label-hint">https://[your-project-id].supabase.co</span>
            </label>
            <input
              type="url"
              className="supabase-input"
              placeholder="https://xyzabcdefghijklm.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="supabase-form-group">
            <label className="supabase-label">
              Supabase Anon (Public) Key
              <span className="supabase-label-hint">Found in Project Settings &gt; API</span>
            </label>
            <input
              type="password"
              className="supabase-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {testResult && (
            <div
              className={`supabase-test-feedback ${
                testResult.success
                  ? 'supabase-test-feedback--success'
                  : 'supabase-test-feedback--error'
              }`}
            >
              {testResult.success ? (
                <>
                  <CheckCircle2 className="feedback-icon" />
                  <span>Success! Successfully reached Supabase Auth endpoint.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="feedback-icon" />
                  <span>Failed: {testResult.message}</span>
                </>
              )}
            </div>
          )}

          <div className="supabase-modal__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleTest}
              disabled={testing || !url}
            >
              {testing ? (
                <>
                  <RefreshCw className="spin-icon" /> Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
            >
              Save & Apply
            </button>
            {currentConfig.isCustom && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleReset}
              >
                Reset Custom
              </button>
            )}
          </div>

          {/* Quick instructions accordion */}
          <div className="supabase-guide">
            <div className="supabase-guide__header">
              <Shield className="supabase-guide__icon" />
              <span>How to get your free credentials:</span>
            </div>
            <ol className="supabase-guide__steps">
              <li>
                Sign in to{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="supabase-link"
                >
                  supabase.com
                </a>{' '}
                and create a project.
              </li>
              <li>
                Navigate to <strong>Project Settings</strong> &rarr; <strong>API</strong>.
              </li>
              <li>
                Copy the <strong>Project URL</strong> and <strong>anon public API key</strong> into
                this dialog or your local <code>.env</code> file.
              </li>
            </ol>
            <button
              type="button"
              className="supabase-sql-toggle-btn"
              onClick={() => setShowSql(!showSql)}
            >
              {showSql ? 'Hide SQL Table Schema' : 'View Optional SQL Schema (quiz_results)'}
            </button>

            {showSql && (
              <div className="supabase-sql-box">
                <div className="supabase-sql-box__header">
                  <span>SQL Editor Snippet</span>
                  <button type="button" onClick={copySql} className="supabase-copy-btn">
                    {copiedSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="supabase-sql-code">{sqlSchema}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
