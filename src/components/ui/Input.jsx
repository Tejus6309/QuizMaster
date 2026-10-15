import { useState } from 'react'

export default function Input({
  label,
  error,
  type = 'text',
  register,
  name,
  hint,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="ui-field">
      {label && <label className="ui-field__label">{label}</label>}
      <div className="ui-field__input-wrap">
        <input
          type={inputType}
          className={`ui-input ${error ? 'ui-input--error' : ''}`}
          {...(register ? register(name) : {})}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            className="ui-field__toggle"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && <span className="ui-field__error">{error}</span>}
      {hint && !error && <span className="ui-field__hint">{hint}</span>}
    </div>
  )
}
