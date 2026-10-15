export default function Select({ label, error, children, register, name, ...props }) {
  return (
    <div className="ui-field">
      {label && <label className="ui-field__label">{label}</label>}
      <select className={`ui-select ${error ? 'ui-select--error' : ''}`} {...(register ? register(name) : {})} {...props}>
        {children}
      </select>
      {error && <span className="ui-field__error">{error}</span>}
    </div>
  )
}
