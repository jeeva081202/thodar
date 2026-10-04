import { useMemo } from 'react'

// Chinna pseudo-random (ovvoru render um same positions)
function rand(seed) {
  let x = seed
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280 }
}

/** ✦ Gold sparkles twinkling around a block. Parent ku position: relative venum. */
export function Sparkles({ count = 7, seed = 7, className = '' }) {
  const stars = useMemo(() => {
    const r = rand(seed)
    return Array.from({ length: count }, () => ({
      left: `${Math.round(r() * 96)}%`, top: `${Math.round(r() * 90)}%`,
      size: 8 + Math.round(r() * 12), delay: `${(r() * 3).toFixed(2)}s`, dur: `${(2.2 + r() * 2).toFixed(2)}s`,
    }))
  }, [count, seed])
  return (
    <span className={`sparkles ${className}`} aria-hidden="true">
      {stars.map((s, i) => (
        <i key={i} style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }} />
      ))}
    </span>
  )
}

/** Mayil thogai "eye" — peacock feather decoration */
export function FeatherEye({ size = 60, style }) {
  return (
    <svg className="feather-eye" width={size} height={size * 1.4} viewBox="0 0 60 84" style={style} aria-hidden="true">
      <path d="M30 84 C30 60 30 40 30 20" stroke="#0F766E" strokeWidth="1.5" opacity=".5" />
      <ellipse cx="30" cy="30" rx="26" ry="30" fill="#0F766E" opacity=".35" />
      <ellipse cx="30" cy="31" rx="19" ry="22" fill="#14B8A6" opacity=".55" />
      <ellipse cx="30" cy="32" rx="13" ry="15" fill="#F59E0B" opacity=".85" />
      <ellipse cx="30" cy="33" rx="9" ry="10" fill="#0EA5E9" />
      <ellipse cx="30" cy="34" rx="5.5" ry="6.5" fill="#1E3A8A" />
    </svg>
  )
}

/** Hero / banners ku floating feathers */
export function Feathers({ count = 4, seed = 3 }) {
  const items = useMemo(() => {
    const r = rand(seed)
    return Array.from({ length: count }, (_, i) => ({
      // right edge la mattum (text mela varaadha maadhiri)
      right: `${1 + Math.round(r() * 9)}%`, top: `${8 + Math.round(r() * 62)}%`, size: 26 + Math.round(r() * 26),
      rot: Math.round(r() * 60 - 30), delay: `${(i * 1.3).toFixed(1)}s`,
    }))
  }, [count, seed])
  return (
    <span className="feathers" aria-hidden="true">
      {items.map((f, i) => (
        <span key={i} className="feather-float" style={{ right: f.right, top: f.top, '--rot': `${f.rot}deg`, animationDelay: f.delay }}>
          <FeatherEye size={f.size} />
        </span>
      ))}
    </span>
  )
}
