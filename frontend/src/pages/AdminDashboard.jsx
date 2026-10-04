import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api, { GENRES, LANGS, TYPES, errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useToast } from '../components/Toast'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { CountUp, DayBars, HBars } from '../components/Charts'
import { timeAgo } from '../utils/time'

const TABS = [['overview', 'chart'], ['users', 'users'], ['stories', 'book'], ['challenges', 'sparkle'], ['reports', 'flag'], ['site', 'settings']]

export default function AdminDashboard() {
  const { t } = useT()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const loadStats = useCallback(() => api.get('/admin/stats/').then((r) => setStats(r.data)), [])
  useEffect(() => { loadStats() }, [loadStats])

  const badge = { users: stats?.totals.pending_users, reports: stats?.totals.open_reports }

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <span className="eyebrow"><Icon name="crown" size={14} /> {t('admin_only')}</span>
          <h1 className="page-title" style={{ margin: '4px 0 0' }}>{t('dashboard')}</h1>
        </div>
      </div>
      <div className="admin-tabs">
        {TABS.map(([k, icon]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {tab === k && <motion.span layoutId="admin-tab" className="admin-tab-bg" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}
            <span className="admin-tab-in"><Icon name={icon} size={16} /> {t({ reports: 'moderation', stories: 'total_stories', challenges: 'challenge_tab' }[k] || k)}
              {badge[k] > 0 && <b className="count-pill">{badge[k]}</b>}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}>
          {tab === 'overview' && <Overview stats={stats} />}
          {tab === 'users' && <Users onChange={loadStats} />}
          {tab === 'stories' && <Stories />}
          {tab === 'challenges' && <AdminChallenges />}
          {tab === 'reports' && <Reports onChange={loadStats} />}
          {tab === 'site' && <Site />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Overview({ stats }) {
  const { t } = useT()
  if (!stats) return <div className="stat-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}</div>
  const s = stats.totals
  const tiles = [
    ['users', t('total_users'), s.users, t('new_this_week', { n: s.new_users_week })],
    ['book', t('total_stories'), s.stories],
    ['branch', t('total_parts'), s.parts, t('new_this_week', { n: s.parts_week })],
    ['heart', t('total_reactions'), s.reactions],
    ['eye', t('total_views'), s.views],
    ['comment', t('comments'), s.comments],
    ['clock', t('pending_users'), s.pending_users],
    ['flag', t('open_reports'), s.open_reports],
  ]
  return (
    <>
      <div className="stat-grid">
        {tiles.map(([icon, label, val, sub], i) => (
          <motion.div key={label} className="stat-tile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
            <span className="stat-ico"><Icon name={icon} size={18} /></span>
            <span className="stat-label">{label}</span>
            <b className="stat-val"><CountUp value={val} /></b>
            {sub && <span className="stat-sub">{sub}</span>}
          </motion.div>
        ))}
      </div>
      <div className="chart-grid">
        <div className="card"><DayBars data={stats.signups} label={t('signups_14')} /></div>
        <div className="card"><DayBars data={stats.parts_daily} label={t('parts_14')} /></div>
        <div className="card"><HBars label={t('by_type')}
          rows={(stats.types || []).map((x) => ({ name: `${TYPES[x.content_type]?.emoji || ''} ${t('t_' + x.content_type)}`, count: x.count }))} /></div>
        <div className="card"><HBars label={t('by_genre')}
          rows={stats.genres.map((g) => ({ name: `${GENRES[g.genre]?.emoji || ''} ${GENRES[g.genre]?.label || g.genre}`, count: g.count }))} /></div>
        <div className="card"><HBars label={t('by_language')}
          rows={stats.languages.map((l) => ({ name: LANGS[l.language] || l.language, count: l.count }))} /></div>
        <div className="card"><HBars label={t('top_reactions')}
          rows={stats.reactions.map((r) => ({ name: r.emoji, count: r.count }))} /></div>
      </div>
    </>
  )
}

function Users({ onChange }) {
  const { t } = useT()
  const { user: me } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(() => api.get('/admin/users/', { params: { q, status } }).then((r) => setRows(r.data)), [q, status])
  useEffect(() => { const tm = setTimeout(load, 250); return () => clearTimeout(tm) }, [load])

  const patch = async (u, body) => {
    try {
      const { data } = await api.patch(`/admin/users/${u.id}/`, body)
      setRows((rs) => rs.map((r) => (r.id === u.id ? { ...r, ...data } : r)))
      toast(t('updated')); onChange()
    } catch (err) { toast(errorText(err), 'err') }
  }
  const remove = async (u) => {
    if (!window.confirm(t('confirm_delete_user'))) return
    await api.delete(`/admin/users/${u.id}/`)
    setRows((rs) => rs.filter((r) => r.id !== u.id)); toast(t('deleted')); onChange()
  }
  const approveAll = async () => {
    const { data } = await api.post('/admin/users/approve-all/')
    toast(`✅ ${data.approved}`); load(); onChange()
  }

  return (
    <>
      <div className="admin-toolbar">
        <div className="search-wrap" style={{ margin: 0, flex: 1 }}>
          <Icon name="search" size={18} />
          <input className="input" placeholder={t('username')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-grad btn-sm" onClick={approveAll}><Icon name="check" size={15} /> {t('approve_all')}</button>
      </div>
      <div className="chips">
        {[['', t('filter_all')], ['pending', t('status_pending')], ['active', t('status_active')],
          ['blocked', t('status_blocked')], ['admins', t('admins')]].map(([k, l]) => (
          <button key={k} className={`chip ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>
      {!rows ? <div className="skeleton" /> : (
        <div className="admin-list">
          {rows.map((u) => {
            const self = u.id === me.id
            return (
              <motion.div layout key={u.id} className="admin-row">
                <Avatar name={u.username} src={u.avatar} size={40} />
                <div className="admin-row-main">
                  <Link to={`/u/${u.username}`}><b>@{u.username}</b></Link> {u.is_staff && '👑'} {self && <span className="muted small">({t('you')})</span>}
                  <span className="muted small block">{u.full_name && <b style={{ color: 'var(--text-2)' }}>{u.full_name} · </b>}{u.state && `📍 ${u.state} · `}{u.email || '—'} · {t('joined')} {timeAgo(u.date_joined)}</span>
                  <span className="muted small block">📚 {u.stories} · ✍️ {u.parts} · ♥ {u.likes}</span>
                </div>
                <span className={`status-chip st-${u.status}`}>
                  {u.status === 'active' ? '🟢' : u.status === 'pending' ? '🟡' : '🔴'} {t('status_' + u.status)}
                </span>
                {!self && (
                  <div className="admin-actions">
                    {u.status === 'pending' && <button className="btn btn-grad btn-sm" onClick={() => patch(u, { is_active: true })}>{t('approve')}</button>}
                    {u.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => patch(u, { is_active: false })}>{t('block')}</button>}
                    {u.status === 'blocked' && <button className="btn btn-ghost btn-sm" onClick={() => patch(u, { is_active: true })}>{t('unblock')}</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => patch(u, { is_staff: !u.is_staff })}>
                      {u.is_staff ? t('remove_admin') : t('make_admin')}
                    </button>
                    <button className="icon-btn" title={t('delete')} onClick={() => remove(u)}><Icon name="trash" size={16} /></button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </>
  )
}

function Stories() {
  const { t } = useT()
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')

  const load = useCallback(() => api.get('/admin/stories/', { params: { q, filter } }).then((r) => setRows(r.data)), [q, filter])
  useEffect(() => { const tm = setTimeout(load, 250); return () => clearTimeout(tm) }, [load])

  const patch = async (s, body) => {
    const { data } = await api.patch(`/admin/stories/${s.id}/`, body)
    setRows((rs) => rs.map((r) => (r.id === s.id ? { ...r, ...data } : r))); toast(t('updated'))
  }
  const remove = async (s) => {
    if (!window.confirm(t('confirm_delete_story'))) return
    await api.delete(`/admin/stories/${s.id}/`)
    setRows((rs) => rs.filter((r) => r.id !== s.id)); toast(t('deleted'))
  }

  return (
    <>
      <div className="admin-toolbar">
        <div className="search-wrap" style={{ margin: 0, flex: 1 }}>
          <Icon name="search" size={18} />
          <input className="input" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="chips">
        {[['', t('filter_all')], ['featured', '⭐ ' + t('featured_f')], ['hidden', t('hidden')]].map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {!rows ? <div className="skeleton" /> : (
        <div className="admin-list">
          {rows.map((s) => (
            <motion.div layout key={s.id} className={`admin-row ${s.is_hidden ? 'is-hidden' : ''}`}>
              <span className="story-emoji">{GENRES[s.genre]?.emoji}</span>
              <div className="admin-row-main">
                <Link to={`/story/${s.id}`}><b>{s.title}</b></Link> {s.is_featured && '⭐'} {s.is_winner && '🏆'} {s.status === 'draft' && <span className="status-chip">{t('status_draft')}</span>} {s.is_hidden && <span className="status-chip st-blocked">{t('hidden')}</span>}
                <span className="muted small block">{TYPES[s.content_type]?.emoji} {t('t_' + s.content_type)} · @{s.created_by} · {LANGS[s.language]} · {timeAgo(s.created_at)}{s.challenge_title && ` · 🎯 ${s.challenge_title}`}</span>
                <span className="muted small block">🌿 {s.parts_count} · ♥ {s.likes_count} · 👁 {s.views}</span>
              </div>
              <div className="admin-actions">
                {s.challenge && (
                  <button className={`btn btn-sm ${s.is_winner ? 'btn-grad' : 'btn-ghost'}`} onClick={() => patch(s, { is_winner: !s.is_winner })}>
                    {s.is_winner ? t('unmark_winner') : t('mark_winner')}
                  </button>
                )}
                <button className={`btn btn-sm ${s.is_featured ? 'btn-grad' : 'btn-ghost'}`} onClick={() => patch(s, { is_featured: !s.is_featured })}>
                  ⭐ {s.is_featured ? t('unfeature') : t('feature')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => patch(s, { is_hidden: !s.is_hidden })}>
                  <Icon name={s.is_hidden ? 'eye' : 'eyeoff'} size={15} /> {s.is_hidden ? t('unhide') : t('hide')}
                </button>
                <button className="icon-btn" title={t('delete')} onClick={() => remove(s)}><Icon name="trash" size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  )
}

function Reports({ onChange }) {
  const { t } = useT()
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('open')
  const load = useCallback(() => api.get('/admin/reports/', { params: { status } }).then((r) => setRows(r.data)), [status])
  useEffect(() => { load() }, [load])

  const act = async (r, action) => {
    try {
      await api.post(`/admin/reports/${r.id}/`, { action })
      toast(t('updated')); load(); onChange()
    } catch (err) { toast(errorText(err), 'err') }
  }

  return (
    <>
      <div className="chips">
        {[['open', t('open')], ['resolved', t('resolved')], ['all', t('filter_all')]].map(([k, l]) => (
          <button key={k} className={`chip ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>
      {!rows ? <div className="skeleton" /> : rows.length === 0 ? <p className="empty">{t('no_reports')}</p> : (
        <div className="admin-list">
          {rows.map((r) => (
            <motion.div layout key={r.id} className="report-card">
              <div className="row-between" style={{ marginBottom: 6 }}>
                <span className="status-chip st-blocked">🚩 {t('r_' + r.reason)}</span>
                <span className="muted small">{t('reported_by')} @{r.reporter} · {timeAgo(r.created_at)}</span>
              </div>
              <blockquote className="report-quote">“{r.content}”</blockquote>
              <p className="muted small">— @{r.part_author} · <Link to={`/story/${r.story_id}?part=${r.part_id}`}>{r.story_title}</Link></p>
              {r.note && <p className="small">💬 {r.note}</p>}
              {r.status === 'open' && (
                <div className="admin-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => act(r, 'dismiss')}>{t('dismiss')}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act(r, 'remove')}>{t('remove_content')}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act(r, 'block')}>{t('remove_block')}</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </>
  )
}

function Site() {
  const { t } = useT()
  const toast = useToast()
  const [s, setS] = useState(null)
  useEffect(() => { api.get('/admin/settings/').then((r) => setS(r.data)) }, [])
  if (!s) return <div className="skeleton" />
  const save = async (patch) => {
    const { data } = await api.patch('/admin/settings/', patch)
    setS(data); toast(t('settings_saved'))
  }
  return (
    <div className="settings-stack">
      <div className="card setting-row">
        <div>
          <b>{t('require_approval')}</b>
          <p className="muted small">{t('require_approval_sub')}</p>
        </div>
        <button className={`switch ${s.require_approval ? 'on' : ''}`} role="switch" aria-checked={s.require_approval}
                onClick={() => save({ require_approval: !s.require_approval })}>
          <motion.span layout className="knob" transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
        </button>
      </div>
      <div className="card">
        <b><Icon name="megaphone" size={16} /> {t('announcement')}</b>
        <p className="muted small">{t('announcement_sub')}</p>
        <textarea className="input" rows={3} maxLength={300} value={s.announcement}
                  onChange={(e) => setS({ ...s, announcement: e.target.value })} />
        <div className="row-gap"><button className="btn btn-grad btn-sm" onClick={() => save({ announcement: s.announcement })}>{t('save_settings')}</button></div>
      </div>
      <div className="card">
        <b>🛠️ Django Admin</b>
        <p className="muted small">Full database access → <code>/admin/</code> on the backend (eg. http://127.0.0.1:8000/admin/)</p>
      </div>
    </div>
  )
}

function AdminChallenges() {
  const { t } = useT()
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const now = new Date()
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  const [f, setF] = useState({ title: '', emoji: '🏆', description: '', content_type: '',
    starts_at: iso(now), ends_at: iso(new Date(now.getTime() + 7 * 86400000)) })
  const load = useCallback(() => api.get('/admin/challenges/').then((r) => setRows(r.data)), [])
  useEffect(() => { load() }, [load])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const create = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/challenges/', { ...f, starts_at: new Date(f.starts_at).toISOString(), ends_at: new Date(f.ends_at).toISOString() })
      toast(t('updated')); setF({ ...f, title: '', description: '' }); load()
    } catch (err) { toast(errorText(err), 'err') }
  }
  const endNow = async (c) => { await api.patch(`/admin/challenges/${c.id}/`, { end_now: true }); load() }
  const remove = async (c) => {
    if (!window.confirm(t('delete') + '?')) return
    await api.delete(`/admin/challenges/${c.id}/`); load()
  }

  return (
    <div className="settings-stack">
      <form className="card" onSubmit={create}>
        <b>✨ {t('new_challenge')}</b>
        <div className="two" style={{ marginTop: 10 }}>
          <input className="input" style={{ maxWidth: 90 }} value={f.emoji} onChange={set('emoji')} maxLength={8} aria-label={t('c_emoji')} />
          <input className="input" placeholder={t('c_title')} value={f.title} onChange={set('title')} required maxLength={120} />
        </div>
        <textarea className="input" rows={2} placeholder={t('c_desc')} value={f.description} onChange={set('description')} maxLength={400} style={{ marginTop: 8 }} />
        <div className="two" style={{ marginTop: 8 }}>
          <label className="small muted">{t('starts')}<input className="input" type="datetime-local" value={f.starts_at} onChange={set('starts_at')} required /></label>
          <label className="small muted">{t('ends')}<input className="input" type="datetime-local" value={f.ends_at} onChange={set('ends_at')} required /></label>
        </div>
        <select className="input" value={f.content_type} onChange={set('content_type')} style={{ marginTop: 8 }}>
          <option value="">{t('challenge_any')}</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {t('t_' + k)}</option>)}
        </select>
        <div className="row-gap"><button className="btn btn-grad btn-sm">{t('create')}</button></div>
      </form>
      {!rows ? <div className="skeleton" /> : rows.map((c) => (
        <div key={c.id} className="admin-row">
          <span className="story-emoji">{c.emoji}</span>
          <div className="admin-row-main">
            <Link to={`/challenges/${c.id}`}><b>{c.title}</b></Link> {c.is_active && <span className="status-chip st-active">● LIVE</span>}
            <span className="muted small block">{new Date(c.starts_at).toLocaleDateString('en-IN')} → {new Date(c.ends_at).toLocaleDateString('en-IN')} · {t('entries', { n: c.entries_count })}</span>
          </div>
          <div className="admin-actions">
            {c.is_active && <button className="btn btn-ghost btn-sm" onClick={() => endNow(c)}>{t('end_now')}</button>}
            <button className="icon-btn" onClick={() => remove(c)} aria-label={t('delete')}><Icon name="trash" size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
