export default function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton__line" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  )
}
