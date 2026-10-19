export function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function calculateScore(correct, total, timePerQuestion) {
  const base = (correct / total) * 100
  const timeBonus = timePerQuestion > 0 ? Math.max(0, (1 - timePerQuestion / 30) * 20) : 0
  return Math.round(base + timeBonus)
}

export function getGrade(percentage) {
  if (percentage >= 90) return { letter: 'A', label: 'Outstanding!' }
  if (percentage >= 80) return { letter: 'B', label: 'Great job!' }
  if (percentage >= 70) return { letter: 'C', label: 'Good effort!' }
  if (percentage >= 60) return { letter: 'D', label: 'Keep practicing!' }
  return { letter: 'F', label: 'Better luck next time!' }
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
