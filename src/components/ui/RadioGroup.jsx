export default function RadioGroup({ label, options, value, onChange, name }) {
  return (
    <div className="ui-field">
      {label && <label className="ui-field__label">{label}</label>}
      <div className="radio-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`radio-chip ${value === opt.value ? 'radio-chip--active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="radio-chip__label">{opt.label}</span>
            {opt.desc && <span className="radio-chip__desc">{opt.desc}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
