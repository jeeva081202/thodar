import { useEffect, useState } from 'react'
import { animate, motion } from 'motion/react'

/** Number 0 la irundhu count-up animation */
export function CountUp({ value }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const c = animate(0, value, { duration: 1.1, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [value])
  return <>{n.toLocaleString('en-IN')}</>
}

/** Vertical bar chart — single series, hover la value tooltip */
export function DayBars({ data, label }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.count))
  const fmt = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <figure className="chart">
      <figcaption>{label}</figcaption>
      <div className="vbars" role="img" aria-label={`${label}: ${data.map((d) => `${fmt(d.date)} ${d.count}`).join(', ')}`}>
        {data.map((d, i) => (
          <div key={d.date} className="vbar-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && <span className="tip">{fmt(d.date)} · <b>{d.count}</b></span>}
            <motion.span className="vbar" initial={{ height: 0 }} animate={{ height: `${(d.count / max) * 100}%` }}
                         transition={{ delay: i * 0.03, duration: 0.5, ease: 'easeOut' }}
                         style={{ opacity: hover === null || hover === i ? 1 : 0.45 }} />
          </div>
        ))}
      </div>
      <div className="vbar-axis"><span>{fmt(data[0].date)}</span><span>{fmt(data[data.length - 1].date)}</span></div>
    </figure>
  )
}

/** Horizontal bars — category name text la, length = count */
export function HBars({ rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <figure className="chart">
      <figcaption>{label}</figcaption>
      {rows.length === 0 && <p className="muted small">—</p>}
      <div className="hbars">
        {rows.map((r, i) => (
          <div key={r.name} className="hbar-row" title={`${r.name}: ${r.count}`}>
            <span className="hbar-name">{r.name}</span>
            <span className="hbar-track">
              <motion.span className="hbar" initial={{ width: 0 }} animate={{ width: `${(r.count / max) * 100}%` }}
                           transition={{ delay: i * 0.06, duration: 0.6, ease: 'easeOut' }} />
            </span>
            <b className="hbar-val">{r.count}</b>
          </div>
        ))}
      </div>
    </figure>
  )
}
