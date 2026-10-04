import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../api/client'
import { useT } from '../i18n'
import Avatar from '../components/Avatar'

export default function SeriesPage() {
  const { id } = useParams()
  const { t } = useT()
  const [s, setS] = useState(null)
  const [nf, setNf] = useState(false)
  useEffect(() => { api.get(`/series/${id}/`).then((r) => setS(r.data)).catch(() => setNf(true)) }, [id])
  if (nf) return <p className="empty">{t('not_found')}</p>
  if (!s) return <div className="skeleton" style={{ height: 300 }} />
  return (
    <>
      <div className="series-hero">
        <span className="eyebrow">📚 {t('series')}</span>
        <h1>{s.title}</h1>
        {s.description && <p>{s.description}</p>}
        <Link to={`/u/${s.author}`} className="row-gap" style={{ marginTop: 6 }}>
          <Avatar name={s.author} src={s.author_avatar} size={28} /> <b>@{s.author}</b>
        </Link>
      </div>
      <h3 className="section-title">{t('all_chapters')} · {s.chapters.length}</h3>
      <div className="chapter-list">
        {s.chapters.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/story/${c.id}`} className="chapter-row">
              <span className="chapter-no">{c.chapter || i + 1}</span>
              <span className="grow"><b>{c.title}</b><span className="muted small block">{c.opening.slice(0, 110)}…</span></span>
              <span className="muted small">♥ {c.likes_count}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  )
}
