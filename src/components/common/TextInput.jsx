import { AlertCircle } from '../icons/Icons.jsx'

/**
 * Reusable TextInput component
 * Practical topic: Reusable input components & Form validation in React
 */
export default function TextInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  icon: Icon,
  rightElement,
  helperText,
  className = '',
  autoComplete,
  ...rest
}) {
  const hasError = Boolean(touched && error)

  return (
    <div className={`qm-form-group ${hasError ? 'qm-form-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="qm-form-label">
          {label}
          {required && <span className="qm-form-required">*</span>}
        </label>
      )}

      <div className="qm-input-wrapper">
        {Icon && (
          <span className="qm-input-icon">
            <Icon />
          </span>
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`qm-input ${Icon ? 'qm-input--has-icon' : ''} ${rightElement ? 'qm-input--has-right' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...rest}
        />

        {rightElement && <div className="qm-input-right-element">{rightElement}</div>}
      </div>

      {hasError ? (
        <p id={`${id}-error`} className="qm-form-error" role="alert">
          <AlertCircle className="qm-form-error-icon" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="qm-form-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
