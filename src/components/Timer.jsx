export default function Timer({ timeLeft, duration }) {
  const pct = duration > 0 ? (timeLeft / duration) * 100 : 0
  const isUrgent = timeLeft <= 5

  return (
    <div className={`timer ${isUrgent ? 'timer--urgent' : ''}`}>
      <svg className="timer__ring" viewBox="0 0 48 48">
        <circle className="timer__bg" cx="24" cy="24" r="20" />
        <circle
          className="timer__fg"
          cx="24"
          cy="24"
          r="20"
          style={{ strokeDashoffset: 125.66 - (125.66 * pct) / 100 }}
        />
      </svg>
      <span className="timer__text">{timeLeft}</span>
    </div>
  )
}