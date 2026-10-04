import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import api, { SPOKEN, TYPES, errorText, mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useT } from '../i18n'
import StoryCard from '../components/StoryCard'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { Feathers } from '../components/Decor'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useT()
  const [p, setP] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('all')
  const [list, setList] = useState(null)

  useEffect(() => {
    let alive = true
    api.get(`/auth/users/${username}/`)
      .then((r) => { if (alive) { setP(r.data); setNotFound(false); setList(null); setTab('all') } })
      .catch(() => alive && setNotFound(true))
    return () => { alive = false }
  }, [username])

  const types = useMemo(() => [...new Set((p?.stories || []).map((s) => s.content_type))], [p])

  if (notFound) return <p className="empty">{t('not_found')}</p>
  if (!p || p.username !== username) return <div className="skeleton" style={{ height: 320 }} />
  const isMe = user?.username === p.username

  const follow = async () => {
    if (!user) return toast(t('login_needed'), 'err')
    try {
      const { data } = await api.post(`/auth/users/${username}/follow/`)
      setP({ ...p, is_following: data.is_following, followers: data.followers })
    } catch (err) { toast(errorText(err), 'err') }
  }
  const showList = async (kind) => {
    const { data } = await api.get(`/auth/users/${username}/${kind}/`)
    setList({ kind, users: data })
  }

  const langs = (p.languages || '').split(',').filter(Boolean)
  const loves = (p.interests || '').split(',').filter((k) => TYPES[k])
  const shown = tab === 'all' ? p.stories : tab === 'parts' ? [] : p.stories.filter((s) => s.content_type === tab)

  return (
    <>
      <motion.div className="profile-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={p.cover ? { backgroundImage: `url(${mediaUrl(p.cover)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        {!p.cover && <><div className="cover-orbs"><i /><i /><i /></div><Feathers count={4} seed={p.username.length} /></>}
      </motion.div>
      <div className="profile-card">
        <div className="profile-top">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Avatar name={p.username} src={p.avatar} size={96} ring />
          </motion.div>
          {isMe ? (
            <Link to="/settings" className="btn btn-ghost btn-sm"><Icon name="edit" size={15} /> {t('edit_profile')}</Link>
          ) : (
            <motion.button whileTap={{ scale: 0.92 }} className={`btn btn-sm ${p.is_following ? 'btn-ghost' : 'btn-grad'}`} onClick={follow}>
              {p.is_following ? <><Icon name="check" size={15} /> {t('unfollow')}</> : <><Icon name="plus" size={15} /> {t('follow')}</>}
            </motion.button>
          )}
        </div>
        <h2>{p.full_name || `@${p.username}`} {p.is_staff && <span title="Admin">👑</span>}</h2>
        {p.full_name && <p className="muted" style={{ margin: '0 0 4px' }}>@{p.username}</p>}
        {p.bio ? <p className="bio">{p.bio}</p> : isMe && <p className="bio muted">{t('no_bio')}</p>}
        <div className="profile-meta">
          {(p.city || p.state) && <span>📍 {[p.city, p.state].filter(Boolean).join(', ')}</span>}
          <span>🗓️ {t('joined')} {new Date(p.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
        </div>
        {(langs.length > 0 || loves.length > 0) && (
          <div className="profile-chips">
            {langs.map((l) => <span key={l} className="mini-tag">🗣️ {SPOKEN[l] || l}</span>)}
            {loves.map((k) => <span key={k} className="type-badge small" style={{ '--tc': TYPES[k].color }}>{TYPES[k].emoji} {t('t_' + k)}</span>)}
          </div>
        )}
        <div className="profile-stats">
          <span><b>{p.stories_started}</b>{t('stories')}</span>
          <span><b>{p.parts_written}</b>{t('parts')}</span>
          <span><b>{p.total_likes}</b>{t('likes')}</span>
          <button className="link-btn" onClick={() => showList('followers')}><b>{p.followers}</b>{t('followers')}</button>
          <button className="link-btn" onClick={() => showList('following')}><b>{p.following}</b>{t('following_n')}</button>
        </div>
      </div>

      {list && (
        <div className="card list-pop">
          <div className="row-between"><b>{list.kind === 'followers' ? t('followers') : t('following_n')}</b>
            <button className="link-btn" onClick={() => setList(null)}><Icon name="x" size={18} /></button></div>
          {list.users.length === 0 ? <p className="muted small">{t('nobody')}</p> : (
            <div className="chips wrap">
              {list.users.map((u) => (
                <Link key={u.username} className="chip user-chip" to={`/u/${u.username}`}>
                  <Avatar name={u.username} src={u.avatar} size={22} /> @{u.username}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card badges-card">
        <h4>🏆 {t('achievements')}</h4>
        <div className="badges">
          {p.badges.filter((b) => b.key !== 'admin' || b.earned).map((b, i) => (
            <motion.div key={b.key} className={`badge-item ${b.earned ? 'earned' : ''}`} title={t('b_' + b.key)}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                        whileHover={b.earned ? { scale: 1.12, rotate: -4 } : {}}>
              <span className="badge-emoji">{b.earned ? b.emoji : '🔒'}</span>
              <span className="badge-name">{t('b_' + b.key)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="type-tabs">
        <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>{t('t_all')} · {p.stories.length}</button>
        {types.map((k) => (
          <button key={k} className={tab === k ? 'active' : ''} style={{ '--tc': TYPES[k]?.color }} onClick={() => setTab(k)}>
            {TYPES[k]?.emoji} {t('t_' + k)}
          </button>
        ))}
        <button className={tab === 'parts' ? 'active' : ''} onClick={() => setTab('parts')}>✍️ {t('parts')} · {p.recent_parts.length}</button>
      </div>

      {tab === 'parts' ? (
        p.recent_parts.length === 0 ? <p className="empty">{t('no_parts')}</p> : (
          <div className="feed">
            {p.recent_parts.map((r) => (
              <Link key={r.id} to={`/story/${r.story_id}?part=${r.id}`} className="post">
                <div className="stat-row" style={{ marginBottom: 8 }}><Icon name="branch" size={14} /> {t('in_story')} <b style={{ color: 'var(--text)' }}>{r.story_title}</b></div>
                <p className="post-quote">{r.content}{r.content.length >= 150 ? '…' : ''}</p>
                <div className="post-foot"><span><Icon name="heart" size={16} /> {r.likes_count}</span></div>
              </Link>
            ))}
          </div>
        )
      ) : shown.length === 0 ? <p className="empty">{t('no_stories')}</p>
        : <div className="masonry">{shown.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</div>}
    </>
  )
}
