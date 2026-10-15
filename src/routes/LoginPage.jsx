import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../schemas/authSchemas.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { Brain, Mail, Lock, AlertCircle } from '../components/icons/ExtraIcons.jsx'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await signIn(data.email, data.password)
      toast('Welcome back!', 'success')
      const redirect = searchParams.get('redirect') || '/dashboard'
      navigate(redirect)
    } catch (err) {
      setServerError(err.message || 'Invalid email or password')
      toast('Login failed', 'error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__logo">
          <Brain className="auth-card__logo-icon" />
          <span>QuizMaster</span>
        </Link>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to continue your learning journey</p>

        {serverError && (
          <div className="auth-error">
            <AlertCircle className="auth-error__icon" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Input
            label="Email"
            type="email"
            name="email"
            register={register}
            error={errors.email?.message}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            register={register}
            error={errors.password?.message}
            placeholder="Your password"
          />
          <Button type="submit" loading={isSubmitting} className="auth-submit">
            Sign In
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
