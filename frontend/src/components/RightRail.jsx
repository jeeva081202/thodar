import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import api, { GENRES } from '../api/client'
import { useT } from '../i18n'
import Avatar from './Avatar'
import Icon from './Icon'
import { FreeBadge } from '../pages/About'
import { Sparkles } from './Decor'

// Desktop right side: Kadhai of the week, top writers, genres
export default function RightRail() {
  const { t } = useT()
  const [week, setWeek] = useState(null)
  const [writers, setWriters] = useState([])

  useEffect(() => {
    api.get('/stories/of-the-week/').then((r) => setWeek(r.data)).catch(() => {})
    api.get('/leaderboard/').then((r) => setWriters(r.data.writers.slice(0, 5))).catch(() => {})
  }, [])

  const card = (i) => ({ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.1 + i * 0.08 } })

  return (
    <aside className="rail">
      {week && (
        <motion.div {...card(0)}>
          <Link to={`/story/${week.id}`} className="rail-card week-card glow-border">
            <Sparkles count={5} seed={21} />
            <span className="eyebrow"><Icon name="sparkle" size={14} fill /> {t('story_of_week')}</span>
            <h3>{week.title}</h3>
            <p className="serif">“{week.opening.slice(0, 110)}…”</p>
            <div className="stat-row">
              <span><Icon name="heart" size={14} /> {week.likes_count}</span>
              <span><Icon name="branch" size={14} /> {week.parts_count}</span>
              <span>@{week.created_by}</span>
            </div>
          </Link>
        </motion.div>
      )}

      {writers.length > 0 && (
        <motion.div className="rail-card" {...card(1)}>
          <h4>{t('top_writers')}</h4>
          {writers.map((w, i) => (
            <Link key={w.username} to={`/u/${w.username}`} className="rail-user">
              <span className="rank-n">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <Avatar name={w.username} src={w.avatar} size={32} />
              <span className="rail-user-name">@{w.username}</span>
              <span className="muted small"><Icon name="heart" size={12} /> {w.likes}</span>
            </Link>
          ))}
        </motion.div>
      )}

      <motion.div className="rail-card" {...card(2)}>
        <h4>{t('genre')}</h4>
        <div className="genre-cloud">
          {Object.entries(GENRES).map(([k, g]) => (
            <Link key={k} to={`/?genre=${k}`} className={`genre-tag g-${k}`}>{g.emoji} {g.label}</Link>
          ))}
        </div>
      </motion.div>
      <FreeBadge />
      <p className="rail-foot">Thodar · {t('tagline_1')} {t('tagline_2')} ✍️ · <Link to="/about">{t('about')}</Link></p>
    </aside>
  )
}
