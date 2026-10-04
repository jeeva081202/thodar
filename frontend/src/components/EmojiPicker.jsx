import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const GROUPS = {
  '😀': ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '🥳', '😇', '🤔', '😏', '😴', '🤯', '😱', '😨', '😰', '😢', '😭', '😡', '🤬', '😈', '👻', '💀', '🤡'],
  '❤️': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💖', '🔥', '✨', '⭐', '🌟', '💫', '⚡', '💥', '🎉', '🎊', '👏', '🙏', '👍', '👎', '✌️', '💪', '🤝'],
  '🌧️': ['🌧️', '⛈️', '🌈', '☀️', '🌙', '🌊', '🌳', '🌸', '🌺', '🍃', '🐦', '🐍', '🐘', '🦚', '🍛', '☕', '🍵', '🥭', '🚗', '🛺', '🚂', '✈️', '🏠', '🛕', '📱', '🔪'],
}

/** Click panna emoji ah onPick ku anuppum */
export default function EmojiPicker({ onPick, label = '😊' }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('😀')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <span className="emoji-picker" ref={ref}>
      <button type="button" className="tool-btn" onClick={() => setOpen(!open)} aria-label="Emoji">{label}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="emoji-pop" initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}>
            <div className="emoji-tabs">
              {Object.keys(GROUPS).map((g) => (
                <button type="button" key={g} className={tab === g ? 'active' : ''} onClick={() => setTab(g)}>{g}</button>
              ))}
            </div>
            <div className="emoji-grid">
              {GROUPS[tab].map((e) => (
                <button type="button" key={e} onClick={() => onPick(e)}>{e}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
