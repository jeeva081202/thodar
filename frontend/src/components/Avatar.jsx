import { mediaUrl } from '../api/client'

// Ready-made avatars: emoji + gradient
export const PRESETS = {
  lion: ['🦁', '#FDBA74', '#F97316'], tiger: ['🐯', '#FCD34D', '#F59E0B'], fox: ['🦊', '#FDA4AF', '#FB7185'],
  panda: ['🐼', '#C4B5FD', '#8B5CF6'], koala: ['🐨', '#A5B4FC', '#6366F1'], frog: ['🐸', '#86EFAC', '#22C55E'],
  unicorn: ['🦄', '#F9A8D4', '#C084FC'], octopus: ['🐙', '#FDA4AF', '#E11D48'], butterfly: ['🦋', '#93C5FD', '#3B82F6'],
  sunflower: ['🌻', '#FDE68A', '#FBBF24'], moon: ['🌙', '#A5B4FC', '#312E81'], star: ['⭐', '#FEF08A', '#F59E0B'],
  mask: ['🎭', '#D8B4FE', '#7C3AED'], art: ['🎨', '#FBCFE8', '#EC4899'], guitar: ['🎸', '#FECACA', '#EF4444'],
  books: ['📚', '#BFDBFE', '#2563EB'], wave: ['🌊', '#A5F3FC', '#0891B2'], fire: ['🔥', '#FED7AA', '#EA580C'],
  clover: ['🍀', '#BBF7D0', '#16A34A'], blossom: ['🌸', '#FBCFE8', '#F472B6'], elephant: ['🐘', '#E2E8F0', '#64748B'],
  peacock: ['🦚', '#99F6E4', '#0D9488'], lotus: ['🪷', '#F5D0FE', '#D946EF'], coffee: ['☕', '#FDE68A', '#92400E'],
}

const PAIRS = [
  ['#8B5CF6', '#EC4899'], ['#F97316', '#FACC15'], ['#06B6D4', '#3B82F6'], ['#10B981', '#84CC16'],
  ['#EC4899', '#F97316'], ['#6366F1', '#06B6D4'], ['#F43F5E', '#A855F7'], ['#14B8A6', '#6366F1'], ['#EAB308', '#EF4444'],
]

/** src: 'url:/media/..' | 'preset:lion' | '' (illaina username letter) */
export default function Avatar({ name = '?', src = '', size = 40, ring = false }) {
  const style = { width: size, height: size, fontSize: size * 0.42 }
  const cls = `avatar ${ring ? 'avatar-ring' : ''}`
  if (src?.startsWith('url:')) {
    return <img className={cls} src={mediaUrl(src.slice(4))} alt={name} style={style} loading="lazy" />
  }
  if (src?.startsWith('preset:') && PRESETS[src.slice(7)]) {
    const [e, a, b] = PRESETS[src.slice(7)]
    return <span className={cls} style={{ ...style, fontSize: size * 0.55, background: `linear-gradient(135deg, ${a}, ${b})` }}>{e}</span>
  }
  let h = 2166136261
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  const [a, b] = PAIRS[h % PAIRS.length]
  return <span className={cls} style={{ ...style, background: `linear-gradient(135deg, ${a}, ${b})` }}>{name[0]?.toUpperCase()}</span>
}
