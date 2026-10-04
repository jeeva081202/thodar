/**
 * Kavithai / quote / part ah azhagaana 1080x1350 image ah maathum (Instagram portrait size).
 * Returns a PNG Blob.
 */
const W = 1080
const H = 1350

function wrap(ctx, text, maxW) {
  const out = []
  for (const para of text.split('\n')) {
    if (!para.trim()) { out.push(''); continue }
    let line = ''
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word } else line = test
    }
    out.push(line)
  }
  return out
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v) => Math.max(0, Math.min(255, v + amt))
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`
}

export async function makeShareCard({ text, author, title, color = '#7C5CFF', emoji = '✨', tamil = false }) {
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Background gradient + soft circles
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, shade(color, 40))
  g.addColorStop(1, shade(color, -60))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  for (const [x, y, r] of [[920, 160, 260], [120, 1180, 300], [980, 1100, 120]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }

  // Inner card
  const pad = 80
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  const r = 48
  ctx.beginPath()
  ctx.roundRect(pad, pad + 40, W - pad * 2, H - pad * 2 - 80, r)
  ctx.fill()

  // Emoji + title
  ctx.textAlign = 'center'
  ctx.font = '72px serif'
  ctx.fillText(emoji, W / 2, pad + 150)
  if (title) {
    ctx.fillStyle = shade(color, -40)
    ctx.font = `700 40px "Plus Jakarta Sans Variable", "Noto Sans Tamil Variable", sans-serif`
    ctx.fillText(title.slice(0, 40), W / 2, pad + 220)
  }

  // Body text — fit size
  const serif = tamil ? '"Noto Serif Tamil Variable", serif' : '"Fraunces Variable", "Noto Serif Tamil Variable", Georgia, serif'
  const maxW = W - pad * 2 - 120
  let size = 64
  let lines = []
  const top = pad + 280
  const bottom = H - pad - 200
  while (size > 26) {
    ctx.font = `500 ${size}px ${serif}`
    lines = wrap(ctx, text, maxW)
    if (lines.length * size * 1.45 <= bottom - top) break
    size -= 4
  }
  if (lines.length * size * 1.45 > bottom - top) {
    const fit = Math.floor((bottom - top) / (size * 1.45))
    lines = lines.slice(0, fit - 1).concat('…')
  }
  ctx.fillStyle = '#1A1530'
  const blockH = lines.length * size * 1.45
  let y = top + (bottom - top - blockH) / 2 + size
  for (const ln of lines) { ctx.fillText(ln, W / 2, y); y += size * 1.45 }

  // Author + brand
  ctx.fillStyle = shade(color, -30)
  ctx.font = `600 36px "Plus Jakarta Sans Variable", "Noto Sans Tamil Variable", sans-serif`
  ctx.fillText(`— ${author}`, W / 2, H - pad - 130)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 40px "Plus Jakarta Sans Variable", sans-serif`
  ctx.fillText('thodar', W / 2, H - 46)

  return new Promise((res) => c.toBlob(res, 'image/png'))
}

/** Phone la share sheet, illaina download */
export async function shareOrDownload(blob, name = 'thodar.png') {
  const file = new File([blob], name, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Thodar' }); return 'shared' } catch { /* cancelled → download */ }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  return 'downloaded'
}
