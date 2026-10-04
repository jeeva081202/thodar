import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { useT } from '../i18n'
import { motion } from 'motion/react'

export default function Leaderboard() {
  const { t } = useT()
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/leaderboard/').then((r) => setData(r.data)) }, [])
  if (!data) return <div className="skeleton" style={{ height: 240 }} />

  const [w1, w2, w3] = data.writers
  const rest = data.writers.slice(3)
  const Slot = ({ w, medal, first, d }) => w ? (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: d, type: 'spring', stiffness: 140 }}>
    <Link to={`/u/${w.username}`} className={`podium-slot ${first ? 'first' : ''}`}>
      <span className="medal">{medal}</span>
      <Avatar name={w.username} src={w.avatar} size={first ? 64 : 50} />
      <b>@{w.username}</b>
      <span className="muted small">♥ {w.likes} · {w.parts} {t('parts')}</span>
    </Link>
    </motion.div>
  ) : <div />

  return (
    <>
      <h1 className="page-title">{t('top_writers')} 🏆</h1>
      <div className="podium">
        <Slot w={w2} medal="🥈" d={0.15} />
        <Slot w={w1} medal="🥇" first d={0} />
        <Slot w={w3} medal="🥉" d={0.3} />
      </div>
      {rest.length > 0 && (
        <div className="card rank-list" style={{ padding: 0 }}>
          {rest.map((w, i) => (
            <Link key={w.username} to={`/u/${w.username}`} className="rank-row">
              <span className="rank-n">{i + 4}</span>
              <Avatar name={w.username} src={w.avatar} size={36} />
              <span className="grow">@{w.username}</span>
              <span className="muted small">♥ {w.likes} · {w.parts} {t('parts')}</span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="section-title"><Icon name="flame" size={20} /> {t('most_loved')}</h2>
      <div className="card" style={{ padding: 0 }}>
        {data.top_parts.map((p) => (
          <Link key={p.id} to={`/story/${p.story}?part=${p.id}`} className="top-part">
            <div className="stat-row"><Avatar name={p.author} src={p.author_avatar} size={22} /><b style={{ color: 'var(--text)' }}>@{p.author}</b>
              <span>{t('in_story')} {p.story_title}</span><span>{Object.keys(p.reactions || {}).slice(0, 3).join('')}</span><span>♥ {p.likes_count}</span></div>
            <p>“{p.content.slice(0, 150)}{p.content.length > 150 ? '…' : ''}”</p>
          </Link>
        ))}
      </div>
    </>
  )
}
