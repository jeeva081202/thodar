import confetti from 'canvas-confetti'

// Accent color la confetti 🎉
function colors() {
  const cs = getComputedStyle(document.documentElement)
  return ['--c1', '--c2', '--c3'].map((v) => {
    const [r, g, b] = cs.getPropertyValue(v).trim().split(/\s+/).map(Number)
    return '#' + [r, g, b].map((x) => (x || 0).toString(16).padStart(2, '0')).join('')
  })
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function celebrate() {
  if (reduced()) return
  const c = colors()
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: c, disableForReducedMotion: true })
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: c }), 180)
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: c }), 300)
}

// Emoji reaction burst — click panna idathula irundhu emoji parakkum
export function emojiBurst(emoji, x, y) {
  if (reduced()) return
  const shape = confetti.shapeFromText({ text: emoji, scalar: 2 })
  confetti({ particleCount: 12, spread: 70, startVelocity: 22, gravity: 0.8, ticks: 90, scalar: 2,
             shapes: [shape], flat: true,
             origin: { x: x / window.innerWidth, y: y / window.innerHeight } })
}
