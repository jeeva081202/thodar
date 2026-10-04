import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { GENRES } from '../api/client'
import Icon from '../components/Icon'
import { useT } from '../i18n'

// Oru path ah book maadhiri kaattum. "PDF download" = browser print → Save as PDF
export default function BookView() {
  const { partId } = useParams()
  const { t } = useT()
  const [data, setData] = useState(null)

  useEffect(() => { api.get(`/parts/${partId}/path/`).then((r) => setData(r.data)) }, [partId])
  if (!data) return <p className="empty">Loading…</p>

  const writers = [...new Set(data.parts.map((p) => p.author))]
  const g = GENRES[data.story.genre] || { label: data.story.genre, emoji: '📖' }
  const ended = data.parts.at(-1)?.is_ending

  return (
    <div className="book-wrap">
      <div className="book-toolbar no-print">
        <Link to={`/story/${data.story.id}?part=${partId}`} className="btn btn-ghost"><Icon name="back" size={16} /> {t('back_stories')}</Link>
        <button className="btn btn-grad" onClick={() => window.print()}><Icon name="download" size={16} /> PDF</button>
      </div>
      <article className="book" lang={data.story.language === 'ta' ? 'ta' : undefined}>
        <header className="book-cover">
          <img src="/logo.svg" alt="" width="48" height="48" />
          <div className="kicker">{g.label} · A Thodar story</div>
          <h1>{data.story.title}</h1>
          <p className="by">Ezhudhiyavargal: {writers.map((w) => '@' + w).join(', ')}</p>
        </header>
        {data.parts.map((p, i) => (
          <section key={p.id} className="book-part">
            <p>{i === 0 ? <span className="dropcap">{p.content[0]}</span> : null}{i === 0 ? p.content.slice(1) : p.content}</p>
            <div className="book-author">— @{p.author}</div>
          </section>
        ))}
        <footer className="book-end">{ended ? '~ முடிவு · The End ~' : '~ தொடரும்… · To be continued ~'}</footer>
      </article>
    </div>
  )
}
