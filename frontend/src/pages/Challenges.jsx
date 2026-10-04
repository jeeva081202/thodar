import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../api/client'
import { useT } from '../i18n'
import { useAuth } from '../context/AuthContext'
import StoryCard from '../components/StoryCard'
import { Feathers, Sparkles } from '../components/Decor'

function daysLeft(iso, t) {
  const ms = new Date(iso) - Date.now()
  const d = Math.ceil(ms / 86400000)
  return t('ends_in', { d: d <= 0 ? '—' : d === 1 ? '1d' : `${d}d` })
}

export function ChallengeCard({ c, i = 0 }) {
  const { t } = useT()
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }}>
      <Link to={`/challenges/${c.id}`} className={`challenge-card ${c.is_active ? 'live' : ''}`}>
        {c.is_active && <Sparkles count={6} seed={c.id * 7} />}
        <span className="ch-emoji">{c.emoji}</span>
        <span className="grow">
          <b>{c.title}</b>
          {c.description && <span className="block small">{c.description}</span>}
          <span className="ch-meta">
            {c.is_active && <span className="live-dot">● LIVE</span>}
            <span>{t('entries', { n: c.entries_count })}</span>
            {c.is_active && <span>{daysLeft(c.ends_at, t)}</span>}
            {c.content_type && <span>{t('t_' + c.content_type)}</span>}
          </span>
        </span>
      </Link>
    </motion.div>
  )
}

export default function Challenges() {
  const { t } = useT()
  const [d, setD] = useState(null)
  useEffect(() => { api.get('/challenges/').then((r) => setD(r.data)) }, [])
  if (!d) return <div className="skeleton" />
  const none = !d.active.length && !d.upcoming.length && !d.past.length
  return (
    <>
      <h1 className="page-title">🎯 {t('challenges')}</h1>
      {none && <p className="empty">{t('no_challenges')}</p>}
      {[['active_challenges', d.active], ['upcoming', d.upcoming], ['past', d.past]].map(([k, list]) => list.length > 0 && (
        <section key={k} style={{ marginBottom: 22 }}>
          <h3 className="section-title">{t(k)}</h3>
          <div className="feed">{list.map((c, i) => <ChallengeCard key={c.id} c={c} i={i} />)}</div>
        </section>
      ))}
    </>
  )
}

export function ChallengeDetail() {
  const { id } = useParams()
  const { t } = useT()
  const { user } = useAuth()
  const [c, setC] = useState(null)
  useEffect(() => { api.get(`/challenges/${id}/`).then((r) => setC(r.data)) }, [id])
  if (!c) return <div className="skeleton" />
  return (
    <>
      <div className="challenge-hero">
        <Feathers count={3} seed={c.id + 2} />
        <Sparkles count={8} seed={c.id} />
        <span className="ch-emoji big">{c.emoji}</span>
        <h1>{c.title}</h1>
        {c.description && <p>{c.description}</p>}
        <div className="ch-meta">
          {c.is_active && <span className="live-dot">● LIVE</span>}
          <span>{t('entries', { n: c.entries_count })}</span>
          {c.is_active && <span>{daysLeft(c.ends_at, t)}</span>}
        </div>
        {c.is_active && <Link to={user ? '/new' : '/register'} className="btn btn-grad shine">{t('join_now_c')}</Link>}
      </div>
      {c.entries.length === 0 ? <p className="empty">✍️</p>
        : <div className="masonry">{c.entries.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</div>}
    </>
  )
}
