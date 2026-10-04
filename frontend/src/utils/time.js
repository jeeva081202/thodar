// "12 minutes ago" maadhiri English la time kaattum
const ago = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return ago(m, 'minute')
  const h = Math.floor(m / 60)
  if (h < 24) return ago(h, 'hour')
  const d = Math.floor(h / 24)
  if (d < 7) return d === 1 ? 'yesterday' : ago(d, 'day')
  if (d < 30) return ago(Math.floor(d / 7), 'week')
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
