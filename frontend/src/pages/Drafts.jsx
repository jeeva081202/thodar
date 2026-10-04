import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../api/client'
import { useT } from '../i18n'
import { useToast } from '../components/Toast'
import { TypeBadge } from '../components/StoryCard'
import Icon from '../components/Icon'
import { timeAgo } from '../utils/time'

export default function Drafts() {
  const { t } = useT()
  const toast = useToast()
  const [items, setItems] = useState(null)
  useEffect(() => { api.get('/drafts/').then((r) => setItems(r.data)) }, [])

  const remove = async (d) => {
    if (!window.confirm(t('confirm_delete_story'))) return
    await api.delete(`/stories/${d.id}/tree/`)
    setItems((xs) => xs.filter((x) => x.id !== d.id)); toast(t('deleted'))
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">📝 {t('drafts')}</h1>
        <Link to="/new" className="btn btn-grad btn-sm"><Icon name="pen" size={15} /> {t('write')}</Link>
      </div>
      {!items ? <div className="skeleton" />
        : items.length === 0 ? <p className="empty">{t('no_drafts')}</p> : (
          <div className="feed">
            {items.map((d, i) => (
              <motion.div key={d.id} className="draft-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <TypeBadge type={d.content_type} small />
                <div className="grow">
                  <b>{d.title || '—'}</b>
                  <p className="muted small" style={{ margin: '2px 0 0' }}>{d.opening.slice(0, 120)}{d.opening.length > 120 ? '…' : ''}</p>
                  <span className="muted small">{timeAgo(d.created_at)}</span>
                </div>
                <Link to={`/edit/${d.id}`} className="btn btn-grad btn-sm"><Icon name="edit" size={14} /> {t('edit_draft')}</Link>
                <button className="icon-btn" onClick={() => remove(d)} aria-label={t('delete')}><Icon name="trash" size={16} /></button>
              </motion.div>
            ))}
          </div>
        )}
    </>
  )
}
