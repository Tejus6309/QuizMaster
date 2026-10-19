import { AlertCircle } from '../icons/Icons.jsx'

/**
 * Reusable TextareaField component
 * Practical topic: Reusable input components & Form validation in React
 */
export default function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  rows = 3,
  maxLength,
  helperText,
  className = '',
  ...rest
}) {
  const hasError = Boolean(touched && error)
  const currentLength = value ? String(value).length : 0

  return (
    <div className={`qm-form-group ${hasError ? 'qm-form-group--error' : ''} ${className}`}>
      <div className="qm-form-label-row">
        {label && (
          <label htmlFor={id} className="qm-form-label">
            {label}
            {required && <span className="qm-form-required">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="qm-char-count">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="qm-textarea"
        aria-invalid={hasError}
        {...rest}
      />

      {hasError ? (
        <p className="qm-form-error" role="alert">
          <AlertCircle className="qm-form-error-icon" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="qm-form-helper">{helperText}</p>
      ) : null}
    </div>
  )
}
