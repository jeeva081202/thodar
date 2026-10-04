import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useT } from '../i18n'
import { LangSwitch } from './Sidebar'
import Icon from './Icon'
import { Feathers, Sparkles } from './Decor'

// Thodar eppadi work aagum — 4 padi (demo users illa)
const CHAIN = [
  ['✍️', { en: 'You write the first line', ta: 'நீ முதல் வரி எழுது' }],
  ['🌿', { en: 'Someone adds the next line', ta: 'யாரோ அடுத்த வரி சேர்ப்பார்' }],
  ['🌳', { en: 'The story branches like a tree', ta: 'கதை மரம் போல கிளைக்கும்' }],
  ['🦚', { en: 'The whole world reads it — free forever', ta: 'உலகமே படிக்கும் — என்றும் இலவசம்' }],
]

export default function AuthLayout({ children }) {
  const { t, lang } = useT()
  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
        <Feathers count={5} seed={13} />
        <Sparkles count={12} seed={8} />
        <Link to="/" className="brand"><img src="/logo.svg" alt="" width="36" height="36" /><span>thodar</span></Link>
        <div className="auth-chain">
          {CHAIN.map(([e, txt], i) => (
            <motion.div key={e} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.35, type: 'spring', stiffness: 120 }}
                        style={{ marginLeft: i * 26 }}>
              <b>{e}</b> {txt[lang] || txt.en}
            </motion.div>
          ))}
        </div>
        <motion.blockquote initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {t('tagline_1')} {t('tagline_2')}
          <span>ஒரு வரி நீ எழுது, கதை உலகம் எழுதும் · You write one line, the world writes the story.</span>
        </motion.blockquote>
      </div>
      <div className="auth-side">
        <motion.div className="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="row-between">
            <Link to="/" className="auth-back"><Icon name="back" size={16} /> {t('home')}</Link>
            <LangSwitch compact />
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
