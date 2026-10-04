import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../api/client'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { useT } from '../i18n'
import { timeAgo } from '../utils/time'

const ICON = { continue: 'branch', like: 'heart', comment: 'comment', follow: 'user' }

export default function Notifications() {
  const { t } = useT()
  const [items, setItems] = useState(null)

  useEffect(() => {
    api.get('/notifications/').then((r) => {
      setItems(r.data.results)
      if (r.data.results.some((n) => !n.is_read)) api.post('/notifications/read-all/')
    })
  }, [])

  return (
    <>
      <h1 className="page-title">{t('notifications')}</h1>
      {!items ? <div className="skeleton" />
        : items.length === 0 ? <p className="empty">{t('no_notifs')}</p> : (
          <div className="notif-list">
            {items.map((n, i) => {
              const to = n.verb === 'follow' ? `/u/${n.actor}` : `/story/${n.story}?part=${n.part}`
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i, 10) * 0.04 }}>
                  <Link to={to} className={`notif ${n.is_read ? '' : 'unread'}`}>
                    <span className="notif-av">
                      <Avatar name={n.actor} src={n.actor_avatar} size={42} />
                      <span className={`notif-kind k-${n.verb}`}>
                        {n.verb === 'like' && n.extra ? <span className="kind-emoji">{n.extra}</span>
                          : <Icon name={ICON[n.verb] || 'bell'} size={11} />}
                      </span>
                    </span>
                    <span className="notif-body">
                      <b>@{n.actor}</b> {t('n_' + n.verb, { e: n.extra || '❤️' })}
                      {n.story_title && <> · <i>{n.story_title}</i></>}
                      <span className="muted small block">{timeAgo(n.created_at)}</span>
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
    </>
  )
}
