export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar__label">
        {current + 1} / {total}
      </span>
    </div>
  )
}
