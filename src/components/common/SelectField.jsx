import { ChevronDown, AlertCircle } from '../icons/Icons.jsx'

/**
 * Reusable SelectField component
 * Practical topic: Reusable input components & Form validation in React
 */
export default function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  helperText,
  className = '',
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

      <div className="qm-select-wrapper">
        <select
          id={id}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="qm-select"
          aria-invalid={hasError}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
              {opt.label ?? opt.name}
            </option>
          ))}
        </select>
        <span className="qm-select-arrow">
          <ChevronDown />
        </span>
      </div>

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
