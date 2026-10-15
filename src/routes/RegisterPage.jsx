import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '../schemas/authSchemas.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { Brain, AlertCircle } from '../components/icons/ExtraIcons.jsx'

function passwordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return Math.min(score, 4)
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')
  const strength = useMemo(() => passwordStrength(password), [password])
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await signUp(data.email, data.password, data.fullName)
      toast('Account created! Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      setServerError(err.message || 'Could not create account')
      toast('Registration failed', 'error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__logo">
          <Brain className="auth-card__logo-icon" />
          <span>QuizMaster</span>
        </Link>
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start generating quizzes from your documents</p>

        {serverError && (
          <div className="auth-error">
            <AlertCircle className="auth-error__icon" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Input
            label="Full Name"
            name="fullName"
            register={register}
            error={errors.fullName?.message}
            placeholder="Jane Doe"
          />
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
            placeholder="At least 8 characters"
          />
          {password && (
            <div className="strength-meter">
              <div className="strength-meter__bars">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`strength-bar ${i < strength ? `strength-bar--${strength}` : ''}`}
                  />
                ))}
              </div>
              <span className="strength-meter__label">{strengthLabels[strength]}</span>
            </div>
          )}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            register={register}
            error={errors.confirmPassword?.message}
            placeholder="Re-enter password"
          />
          <label className="auth-checkbox">
            <input type="checkbox" {...register('terms')} />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
          {errors.terms && <span className="ui-field__error">{errors.terms.message}</span>}

          <Button type="submit" loading={isSubmitting} className="auth-submit">
            Create Account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
