import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'

/**
 * Square (or wide) crop: drag panni position, slider la zoom.
 * onDone(blob) → cropped JPEG blob.
 */
export default function ImageCropper({ file, aspect = 1, outW = 512, onDone, onCancel }) {
  const { t } = useT()
  const [img, setImg] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef(null)
  const BOX = 280
  const boxH = BOX / aspect

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const b = Math.max(BOX / im.width, boxH / im.height)
      setImg(im); setZoom(1)
      setPos({ x: (BOX - im.width * b) / 2, y: (boxH - im.height * b) / 2 })   // centre la start
    }
    im.src = url
    return () => setTimeout(() => URL.revokeObjectURL(url), 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  if (!img) return <div className="cropper-box skeleton" style={{ width: BOX, height: boxH }} />

  // image box ah full ah cover pannura base scale
  const base = Math.max(BOX / img.width, boxH / img.height)
  const scale = base * zoom
  const w = img.width * scale
  const h = img.height * scale
  const clamp = (p) => ({
    x: Math.min(0, Math.max(BOX - w, p.x)),
    y: Math.min(0, Math.max(boxH - h, p.y)),
  })
  const cur = clamp(pos)

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y }
  }
  const move = (e) => {
    if (!drag.current) return
    setPos(clamp({ x: drag.current.ox + e.clientX - drag.current.sx, y: drag.current.oy + e.clientY - drag.current.sy }))
  }
  const up = () => { drag.current = null }

  const setZ = (z) => {
    // centre la zoom
    const cx = BOX / 2 - cur.x
    const cy = boxH / 2 - cur.y
    const r = z / zoom
    setZoom(z)
    setPos({ x: BOX / 2 - cx * r, y: boxH / 2 - cy * r })
  }

  const done = () => {
    const outH = Math.round(outW / aspect)
    const c = document.createElement('canvas')
    c.width = outW; c.height = outH
    const ctx = c.getContext('2d')
    const k = outW / BOX
    ctx.drawImage(img, cur.x * k, cur.y * k, w * k, h * k)
    c.toBlob((b) => onDone(b), 'image/jpeg', 0.9)
  }

  return (
    <div className="cropper">
      <div className={`cropper-box ${aspect === 1 ? 'round' : ''}`} style={{ width: BOX, height: boxH }}
           onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <img src={img.src} alt="" draggable={false}
             style={{ width: w, height: h, transform: `translate(${cur.x}px, ${cur.y}px)` }} />
      </div>
      <p className="muted small center" style={{ margin: 0 }}>✋ {t('drag_hint')}</p>
      <label className="zoom-row">🔍 {t('zoom')}
        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZ(Number(e.target.value))} />
      </label>
      <div className="row-gap" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>{t('cancel')}</button>
        <button type="button" className="btn btn-grad btn-sm" onClick={done}>✓ {t('use_photo')}</button>
      </div>
    </div>
  )
}
