import { AnimatePresence, motion } from 'motion/react'
import Icon from './Icon'

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-back" onClick={onClose}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
                      initial={{ y: 30, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{title}</h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
