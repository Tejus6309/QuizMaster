import { Check, AlertCircle } from '../icons/Icons.jsx'

/**
 * Reusable CheckboxField component
 * Practical topic: Reusable input components & Form validation in React
 */
export default function CheckboxField({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const hasError = Boolean(touched && error)

  return (
    <div className={`qm-checkbox-group ${hasError ? 'qm-checkbox-group--error' : ''} ${className}`}>
      <label htmlFor={id} className="qm-checkbox-label">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={Boolean(checked)}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="qm-checkbox-native"
          aria-invalid={hasError}
          {...rest}
        />
        <span className="qm-checkbox-custom">
          <Check className="qm-checkbox-check-icon" />
        </span>
        <span className="qm-checkbox-text">
          <span className="qm-checkbox-title">
            {label}
            {required && <span className="qm-form-required">*</span>}
          </span>
          {description && <span className="qm-checkbox-desc">{description}</span>}
        </span>
      </label>

      {hasError && (
        <p className="qm-form-error qm-checkbox-error" role="alert">
          <AlertCircle className="qm-form-error-icon" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
