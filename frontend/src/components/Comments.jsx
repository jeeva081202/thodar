import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api, { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useToast } from './Toast'
import Avatar from './Avatar'
import Icon from './Icon'
import SmartField, { finalizeText } from './SmartField'
import { timeAgo } from '../utils/time'

export default function Comments({ partId, onCount }) {
  const { user } = useAuth()
  const { t } = useT()
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [text, setText] = useState('')

  useEffect(() => {
    let alive = true
    api.get(`/parts/${partId}/comments/`).then((r) => alive && setItems(r.data))
    return () => { alive = false }
  }, [partId])

  const add = async (final) => {
    const body = (final ?? finalizeText(text)).trim()
    if (!body) return
    try {
      const { data } = await api.post(`/parts/${partId}/comments/`, { text: body })
      const next = [...items, data]
      setItems(next); setText(''); onCount?.(next.length)
    } catch (err) { toast(errorText(err), 'err') }
  }

  const remove = async (id) => {
    await api.delete(`/comments/${id}/`)
    const next = items.filter((c) => c.id !== id)
    setItems(next); onCount?.(next.length)
  }

  return (
    <motion.div className="comments" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
      {items === null ? <p className="muted small">{t('loading')}</p>
        : items.length === 0 ? <p className="muted small" style={{ margin: 0 }}>{t('no_comments')}</p>
        : (
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.div key={c.id} className="comment" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}>
                <Avatar name={c.user} src={c.avatar} size={28} />
                <div className="comment-body">
                  <Link to={`/u/${c.user}`}>@{c.user}</Link>
                  <span className="muted small">{timeAgo(c.created_at)}</span>
                  <p>{c.text}</p>
                </div>
                {user?.username === c.user && (
                  <button className="link-btn" onClick={() => remove(c.id)} title={t('delete')}><Icon name="trash" size={15} /></button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      {user && (
        <div className="comment-form">
          <SmartField as="input" value={text} onChange={setText} onEnter={add} placeholder={t('comment_ph')} maxLength={500} />
          <button className="btn btn-grad btn-sm" disabled={!text.trim()} onClick={() => add()}>{t('post')}</button>
        </div>
      )}
    </motion.div>
  )
}
