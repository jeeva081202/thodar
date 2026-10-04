import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { Feathers, Sparkles } from '../components/Decor'

// ✏️ Un peru / username inga maathikko
const CREATOR = { name: 'Jeeva', username: 'jeeva' }

const PROMISES = [
  ['💛', 'p_free'], ['🚫', 'p_nopremium'], ['🙅', 'p_noads'], ['🔒', 'p_nodata'], ['🌏', 'p_langs'], ['🧑‍💻', 'p_open'],
]

export function FreeBadge() {
  const { t } = useT()
  return <Link to="/about" className="free-badge">💛 {t('free_forever')}</Link>
}

export default function About() {
  const { t } = useT()
  const { user } = useAuth()
  return (
    <div className="about">
      <motion.section className="about-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Feathers count={5} seed={9} />
        <Sparkles count={10} seed={4} />
        <motion.img src="/logo.svg" alt="" width="72" height="72" initial={{ rotate: -12, scale: 0.6 }}
                    animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} />
        <span className="free-pill">💛 {t('free_forever')}</span>
        <h1>{t('about_title')}</h1>
        <p>{t('about_sub')}</p>
      </motion.section>

      <h2 className="section-title">🤝 {t('promise')}</h2>
      <div className="promise-grid">
        {PROMISES.map(([e, k], i) => (
          <motion.div key={k} className="promise" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }} whileHover={{ y: -4 }}>
            <span className="promise-emoji">{e}</span>
            <b>{t(k)}</b>
          </motion.div>
        ))}
      </div>

      <section className="card about-why">
        <h2>🌳 {t('why_title')}</h2>
        <p className="serif">{t('why_body')}</p>
      </section>

      <section className="card about-why">
        <h2>🧑‍💻 {t('open_source')}</h2>
        <p>{t('open_source_body')}</p>
      </section>

      <p className="made-by">
        {t('made_by')} <Link to={`/u/${CREATOR.username}`}><b>{CREATOR.name}</b></Link> {t('made_note')} ✍️
      </p>
      <div className="center">
        <Link to={user ? '/new' : '/register'} className="btn btn-grad btn-lg shine">{t('start_writing')}</Link>
      </div>
    </div>
  )
}
