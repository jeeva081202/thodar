import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useToast } from './Toast'
import { emojiBurst } from '../utils/celebrate'
import Icon from './Icon'

export const REACTIONS = ['❤️', '😂', '😱', '😢', '🔥', '👏']

export default function Reactions({ part, onUpdate }) {
  const { user } = useAuth()
  const { t } = useT()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hoverT = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const react = async (emoji, ev) => {
    setOpen(false)
    if (!user) return toast(t('login_needed'), 'err')
    if (part.my_reaction !== emoji && ev) emojiBurst(emoji, ev.clientX, ev.clientY)
    const { data } = await api.post(`/parts/${part.id}/like/`, { emoji })
    onUpdate({ my_reaction: data.my_reaction, liked_by_me: data.liked, likes_count: data.likes_count, reactions: data.reactions })
  }

  const top = Object.entries(part.reactions || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const mine = part.my_reaction

  return (
    <span className="reactions" ref={ref}
          onMouseEnter={() => { hoverT.current = setTimeout(() => setOpen(true), 350) }}
          onMouseLeave={() => clearTimeout(hoverT.current)}>
      <button className={`act react-main ${mine ? 'reacted' : ''}`} onClick={() => setOpen(!open)} aria-label="React">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={mine || 'none'} className="react-ico"
                       initial={{ scale: 0.3, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                       exit={{ scale: 0.3, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            {mine || <Icon name="heart" size={17} />}
          </motion.span>
        </AnimatePresence>
        {top.length > 0 ? (
          <span className="react-summary">{top.map(([e]) => <span key={e}>{e}</span>)}<b>{part.likes_count}</b></span>
        ) : <b>{part.likes_count}</b>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span className="react-tray" initial={{ opacity: 0, y: 10, scale: 0.9 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
                       transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            {REACTIONS.map((e, i) => (
              <motion.button key={e} className={mine === e ? 'chosen' : ''} onClick={(ev) => react(e, ev)}
                             initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                             transition={{ delay: i * 0.035, type: 'spring', stiffness: 500, damping: 20 }}
                             whileHover={{ scale: 1.45, y: -6 }} whileTap={{ scale: 0.9 }}>
                {e}
                {part.reactions?.[e] > 0 && <small>{part.reactions[e]}</small>}
              </motion.button>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
