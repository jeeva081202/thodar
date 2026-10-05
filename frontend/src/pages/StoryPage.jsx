import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api, { GENRES, LANGS, TYPES, errorText, mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useToast } from '../components/Toast'
import StoryTree from '../components/StoryTree'
import Comments from '../components/Comments'
import Reactions from '../components/Reactions'
import ReportModal from '../components/ReportModal'
import SmartField, { finalizeText } from '../components/SmartField'
import { TypeBadge } from '../components/StoryCard'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { timeAgo } from '../utils/time'
import { celebrate } from '../utils/celebrate'
import { makeShareCard, shareOrDownload } from '../utils/shareCard'

export default function StoryPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { t } = useT()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [selectedId, setSelectedIdRaw] = useState(null)
  const [draft, setDraft] = useState('')
  const [speaker, setSpeaker] = useState('')
  const maxLen = ({ article: 12000, quote: 300 })[data?.story?.content_type] || 5000
  const [isEnding, setIsEnding] = useState(false)
  const [img, setImg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState('read')
  const [openComments, setOpenComments] = useState(null)
  const [editing, setEditing] = useState(null)
  const [reporting, setReporting] = useState(null)

  const setSelectedId = (pid) => {
    setSelectedIdRaw(pid)
    setParams(pid ? { part: pid } : {}, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setData(null)
    api.get(`/stories/${id}/tree/`).then((r) => {
      if (!alive) return
      setData(r.data); setNotFound(false)
      const wanted = Number(params.get('part'))
      setSelectedIdRaw(r.data.parts.some((p) => p.id === wanted) ? wanted : bestLeaf(r.data.parts))
      if (!r.data.story.can_continue) setOpenComments(r.data.parts[0]?.id)
    }).catch(() => alive && setNotFound(true))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const byId = useMemo(() => Object.fromEntries((data?.parts || []).map((p) => [p.id, p])), [data])
  const path = useMemo(() => {
    const out = []
    let node = byId[selectedId]
    while (node) { out.unshift(node); node = byId[node.parent] }
    return out
  }, [byId, selectedId])
  const branches = useMemo(
    () => (data?.parts || []).filter((p) => p.parent === selectedId).sort((a, b) => b.likes_count - a.likes_count),
    [data, selectedId],
  )
  // Dialogue: ovvoru speaker kum oru side + color
  const speakerSide = useMemo(() => {
    const order = []
    for (const p of data?.parts || []) if (p.speaker && !order.includes(p.speaker)) order.push(p.speaker)
    return Object.fromEntries(order.map((s, i) => [s, i]))
  }, [data])

  if (notFound) return <p className="empty">{t('not_found')} <Link to="/">← {t('home')}</Link></p>
  if (!data) return <div className="feed">{[1, 2].map((i) => <div key={i} className="skeleton" />)}</div>

  const s = data.story
  const type = s.content_type
  const ty = TYPES[type] || TYPES.kadhai
  const g = GENRES[s.genre]
  const current = byId[selectedId]
  const root = data.parts.find((p) => p.parent === null)
  const leaves = data.parts.filter((p) => !data.parts.some((c) => c.parent === p.id)).length
  const canDelete = user && (s.is_owner || user.is_staff)
  const ta = s.language === 'ta' ? 'ta' : undefined
  const anon = s.created_by === 'anonymous'
  const showTree = s.can_continue && type !== 'kavithai'

  const updatePart = (pid, patch) =>
    setData((d) => ({ ...d, parts: d.parts.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }))
  const needLogin = () => { toast(t('login_needed'), 'err'); return true }

  const bookmark = async () => {
    if (!user) return needLogin()
    const { data: r } = await api.post(`/stories/${id}/bookmark/`)
    setData((d) => ({ ...d, story: { ...d.story, bookmarked: r.bookmarked } }))
    toast(r.bookmarked ? t('bookmarked') : t('unbookmarked'))
  }

  const shareLink = async () => {
    const url = `${window.location.origin}/story/${id}${selectedId ? `?part=${selectedId}` : ''}`
    try {
      if (navigator.share) await navigator.share({ title: s.title, url })
      else { await navigator.clipboard.writeText(url); toast(t('link_copied')) }
    } catch { /* cancelled */ }
  }

  const shareImage = async (p) => {
    toast(t('downloading'))
    const blob = await makeShareCard({
      text: p.content.slice(0, 600), author: p.author === 'anonymous' ? t('anonymous') : `@${p.author}`,
      title: type === 'quote' ? '' : s.title, color: s.genre === 'love' && type === 'kadhai' ? '#F43F5E' : ty.color,
      emoji: ty.emoji, tamil: s.language === 'ta',
    })
    const how = await shareOrDownload(blob, `thodar-${s.id}.png`)
    if (how === 'downloaded') toast(t('image_ready'))
  }

  const publish = async () => {
    try {
      await api.patch(`/stories/${id}/tree/`, { status: 'published' })
      celebrate(); toast(t('published'))
      setData((d) => ({ ...d, story: { ...d.story, status: 'published' } }))
    } catch (err) { toast(errorText(err), 'err') }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const form = new FormData()
      form.append('content', finalizeText(draft))
      form.append('is_ending', isEnding ? 'true' : 'false')
      if (type === 'dialogue') form.append('speaker', finalizeText(speaker))
      if (img) form.append('image', img)
      const wasBranch = branches.length > 0
      const { data: part } = await api.post(`/parts/${selectedId}/continue/`, form)
      setData((d) => ({
        ...d,
        parts: [...d.parts.map((p) => (p.id === selectedId ? { ...p, children_count: p.children_count + 1 } : p)), part],
      }))
      setSelectedId(part.id)
      setDraft(''); setIsEnding(false); setImg(null)
      celebrate()
      toast(wasBranch ? t('branch_added') : t('continued'))
    } catch (err) { toast(errorText(err), 'err') } finally { setBusy(false) }
  }

  const saveEdit = async () => {
    try {
      const { data: p } = await api.patch(`/parts/${editing.id}/`, { content: finalizeText(editing.text) })
      updatePart(p.id, p); setEditing(null); toast(t('updated'))
    } catch (err) { toast(errorText(err), 'err') }
  }

  const deletePart = async (p) => {
    if (!window.confirm(t('confirm_delete_part'))) return
    try {
      await api.delete(`/parts/${p.id}/`)
      setData((d) => ({
        ...d,
        parts: d.parts.filter((x) => x.id !== p.id)
          .map((x) => (x.id === p.parent ? { ...x, children_count: x.children_count - 1 } : x)),
      }))
      setSelectedId(p.parent); toast(t('deleted'))
    } catch (err) { toast(errorText(err), 'err') }
  }

  const deleteStory = async () => {
    if (!window.confirm(t('confirm_delete_story'))) return
    await api.delete(`/stories/${id}/tree/`)
    toast(t('deleted')); nav('/')
  }

  // ---------- one part (shared by all layouts) ----------
  const renderPart = (p, i, single = false) => {
    const mine = user?.username === p.author || (anon && s.is_owner && p.parent === null)
    const canModify = mine && p.children_count === 0
    const side = type === 'dialogue' ? (speakerSide[p.speaker] ?? 0) % 2 : 0
    return (
      <motion.article key={p.id} layout="position"
                      className={`part p-${type} ${p.id === selectedId && !single ? 'current' : ''} ${type === 'dialogue' ? `side-${side}` : ''} ${single ? 'single' : ''}`}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                      onClick={() => !single && setSelectedId(p.id)}>
        {!single && <Avatar name={p.author} src={p.author_avatar} size={32} />}
        <div className="part-head">
          {p.author === 'anonymous' ? <span>🎭 {t('anonymous')}</span>
            : <Link to={`/u/${p.author}`} onClick={(e) => e.stopPropagation()}>@{p.author}</Link>}
          {!single && <span className="muted small">{t('part_n', { n: i + 1 })} · {timeAgo(p.created_at)}</span>}
        </div>
        {type === 'dialogue' && p.speaker && <span className="speaker-name">{p.speaker}</span>}
        {editing?.id === p.id ? (
          <div onClick={(e) => e.stopPropagation()}>
            <SmartField rows={4} value={editing.text} onChange={(v) => setEditing({ ...editing, text: v })} />
            <div className="row-gap">
              <button className="btn btn-grad btn-sm" onClick={saveEdit}>{t('save')}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>{t('cancel')}</button>
            </div>
          </div>
        ) : type === 'quote' ? (
          <blockquote className="big-quote serif">“{p.content}”</blockquote>
        ) : type === 'article' ? (
          <div className="article-body serif">{p.content.split(/\n{2,}/).map((para, k) => <p key={k}>{para}</p>)}</div>
        ) : (
          <p className="part-text">{p.content}</p>
        )}
        {p.image && <img className="part-image" src={mediaUrl(p.image)} alt="" loading="lazy" />}
        <div className="part-actions" onClick={(e) => e.stopPropagation()}>
          <Reactions part={p} onUpdate={(patch) => updatePart(p.id, patch)} />
          <button className={`act ${openComments === p.id ? 'on' : ''}`} onClick={() => setOpenComments(openComments === p.id ? null : p.id)}>
            <Icon name="comment" size={17} /> {p.comments_count}
          </button>
          <button className="act" onClick={() => shareImage(p)} title={t('share_image')}><Icon name="download" size={16} /></button>
          {p.children_count > 1 && <span className="branch-count"><Icon name="branch" size={14} /> {t('branches', { n: p.children_count })}</span>}
          {p.is_ending && <span className="badge-end"><Icon name="flag" size={12} /> {t('ending')}</span>}
          <span className="owner-actions">
            {canModify && editing?.id !== p.id && s.can_continue && (
              <>
                <button className="act" onClick={() => setEditing({ id: p.id, text: p.content })} title={t('edit')}><Icon name="edit" size={16} /></button>
                {p.parent && <button className="act" onClick={() => deletePart(p)} title={t('delete')}><Icon name="trash" size={16} /></button>}
              </>
            )}
            {user && !mine && <button className="act" onClick={() => setReporting(p.id)} title={t('report')}><Icon name="flag" size={15} /></button>}
          </span>
        </div>
        {openComments === p.id && (
          <div onClick={(e) => e.stopPropagation()}>
            <Comments partId={p.id} onCount={(n) => updatePart(p.id, { comments_count: n })} />
          </div>
        )}
      </motion.article>
    )
  }

  const continueLabel = type === 'kavithai' ? t('reply_poem') : type === 'dialogue' ? t('next_line') : t('continue_title')

  return (
    <div className={`story-page sp-${type}`} style={{ '--tc': s.genre === 'love' && type === 'kadhai' ? '#F43F5E' : ty.color }}>
      {s.status === 'draft' && (
        <div className="draft-banner">
          📝 {t('draft_banner')}
          <span className="row-gap" style={{ margin: 0 }}>
            <Link to={`/edit/${s.id}`} className="btn btn-ghost btn-sm">{t('edit_draft')}</Link>
            <button className="btn btn-grad btn-sm" onClick={publish}>{t('publish_now')}</button>
          </span>
        </div>
      )}

      {s.cover && <motion.img className="story-cover" src={mediaUrl(s.cover)} alt="" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} />}

      <motion.div className="story-head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="back"><Icon name="back" size={16} /> {t('back_stories')}</Link>
        <div className="row-gap" style={{ marginTop: 0 }}>
          <TypeBadge type={type} />
          {g && <span className="mini-tag">{g.emoji} {g.label}</span>}
          <span className="mini-tag"><Icon name="globe" size={12} /> {LANGS[s.language]}</span>
          {s.is_featured && <span className="mini-tag">⭐ {t('featured')}</span>}
          {s.is_winner && <span className="mini-tag win">🏆 {t('winner')}</span>}
          {s.challenge && <Link to={`/challenges/${s.challenge.id}`} className="mini-tag">🎯 {s.challenge.title}</Link>}
        </div>
        {type !== 'quote' && <h1 lang={ta}>{s.title}</h1>}
        <div className="story-meta">
          <Avatar name={s.created_by} src={s.avatar} size={28} />
          {anon ? <span>🎭 {t('anonymous')}</span> : <span>{t('by')} <Link to={`/u/${s.created_by}`}>@{s.created_by}</Link></span>}
          <span className="dot">{timeAgo(s.created_at)}</span>
          {type === 'article' && <span className="dot">{t('min_read', { n: s.reading_time })}</span>}
          {s.can_continue && <span className="dot">{data.parts.length} {t('parts')}</span>}
          {showTree && <span className="dot">{leaves} {t('paths')}</span>}
          <span className="dot"><Icon name="eye" size={14} /> {s.views}</span>
        </div>
        <div className="story-actions">
          <motion.button whileTap={{ scale: 0.9 }} className={`pill ${s.bookmarked ? 'on' : ''}`} onClick={bookmark}>
            <Icon name="bookmark" size={16} fill={s.bookmarked} /> {s.bookmarked ? t('saved_one') : t('save')}
          </motion.button>
          <button className="pill" onClick={shareLink}><Icon name="share" size={16} /> {t('share')}</button>
          {root && <button className="pill" onClick={() => shareImage(type === 'kadhai' || type === 'dialogue' ? (current || root) : root)}><Icon name="download" size={16} /> {t('share_image')}</button>}
          {s.can_continue && <Link className="pill" to={`/book/${selectedId}`}><Icon name="book" size={16} /> {t('book_pdf')}</Link>}
          {canDelete && <button className="pill danger" onClick={deleteStory}><Icon name="trash" size={16} /> {t('delete')}</button>}
        </div>
        {showTree && (
          <div className="tabs">
            <button className={view === 'read' ? 'active' : ''} onClick={() => setView('read')}><Icon name="read" size={16} /> {t('read')}</button>
            <button className={view === 'tree' ? 'active' : ''} onClick={() => setView('tree')}><Icon name="tree" size={16} /> {t('tree')}</button>
          </div>
        )}
      </motion.div>

      {s.series && (
        <div className="series-box">
          <Link to={`/series/${s.series.id}`} className="series-title">📚 {s.series.title}</Link>
          <span className="muted small">{t('chapter_n', { n: s.series.chapter })} {t('of_n', { n: s.series.chapters.length })}</span>
          <SeriesNav series={s.series} currentId={s.id} />
        </div>
      )}

      {!s.can_continue ? (
        <section className="single-post" lang={ta}>{root && renderPart(root, 0, true)}</section>
      ) : (
        <div className={`story-layout show-${view} ${showTree ? '' : 'no-tree'}`}>
          <section className="reader" lang={ta}>
            <AnimatePresence initial={false}>{path.map((p, i) => renderPart(p, i))}</AnimatePresence>

            {branches.length > 0 && (
              <div className="branches">
                <h3><Icon name="branch" size={18} /> {type === 'kavithai' ? t('reply_poems') : t('what_next')}</h3>
                <div className="branch-list">
                  {branches.map((b, i) => (
                    <motion.button key={b.id} className="branch" onClick={() => setSelectedId(b.id)}
                                   initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                   whileHover={{ x: 4 }}>
                      <span className="branch-meta">
                        <Avatar name={b.author} src={b.author_avatar} size={20} /> @{b.author}
                        {b.speaker && <b> · {b.speaker}</b>}
                        {Object.entries(b.reactions || {}).slice(0, 3).map(([e, c]) => <span key={e}>{e}{c}</span>)}
                        {b.is_ending ? ' · 🏁' : ''}
                      </span>
                      <span>{b.content.slice(0, 130)}{b.content.length > 130 ? '…' : ''}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {s.status === 'draft' ? null : current?.is_ending ? (
              <div className="card end-card">
                {t('path_ended')}<br />
                <Link to={`/book/${selectedId}`}>{t('read_book')}</Link><br />
                <span className="small muted">{t('try_other')}</span>
              </div>
            ) : user ? (
              <form className="card continue" onSubmit={submit}>
                <h3><Icon name="pen" size={18} /> {continueLabel}</h3>
                {type === 'dialogue' && (
                  <SmartField as="input" value={speaker} onChange={setSpeaker} maxLength={40} placeholder={`🎭 ${t('speaker')} — ${t('speaker_ph')}`} toolbar={false} />
                )}
                <SmartField rows={type === 'kavithai' ? 7 : 5} maxLength={maxLen} value={draft} onChange={setDraft}
                            className={`ta-${type}`} placeholder={branches.length ? t('new_branch_ph') : t('continue_ph')} />
                <div className="continue-row">
                  <label className="check">
                    <input type="checkbox" checked={isEnding} onChange={(e) => setIsEnding(e.target.checked)} />
                    {t('this_is_end')}
                  </label>
                  <label className="tool-btn" style={{ cursor: 'pointer' }}>
                    🖼️ {img ? img.name.slice(0, 14) : t('add_image')}
                    <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => setImg(e.target.files?.[0] || null)} />
                  </label>
                  <span className="counter" title={`Max ${maxLen} letters`}>{draft.length}/{maxLen} max</span>
                </div>
                {type === 'dialogue' && draft.trim() && !speaker.trim() && (
                  <p className="form-hint">👆 Mela <b>Character name</b> type pannunga (eg. Ravi) — apram dhaan Add button work aagum</p>
                )}
                {type !== 'dialogue' && draft.trim().length > 0 && draft.trim().length < 10 && (
                  <p className="form-hint">✍️ Kuraindhadhu 10 letters ezhudhunga — innum {10 - draft.trim().length} venum</p>
                )}
                <motion.button whileTap={{ scale: 0.96 }} className="btn btn-grad shine"
                               disabled={busy || (type === 'dialogue' ? !draft.trim() || !speaker.trim() : draft.trim().length < 10)}>
                  {busy ? t('adding') : branches.length ? t('new_branch') : t('add')}
                </motion.button>
              </form>
            ) : (
              <div className="card end-card"><Link to="/login">{t('login')}</Link> {t('login_to_continue')}</div>
            )}
          </section>

          {showTree && (
            <aside className="tree-side">
              <StoryTree key={view} parts={data.parts} selectedId={selectedId} pathIds={path.map((p) => p.id)}
                         onSelect={(pid) => { setSelectedId(pid); setView('read') }} />
              <div className="tree-legend">
                <span><i style={{ background: 'rgb(var(--c2))' }} />{t('legend_path')}</span>
                <span><i style={{ background: 'rgb(var(--c3))' }} />{t('legend_now')}</span>
                <span>{t('legend_click')}</span>
              </div>
            </aside>
          )}
        </div>
      )}
      <ReportModal partId={reporting} onClose={() => setReporting(null)} />
    </div>
  )
}

function SeriesNav({ series, currentId }) {
  const { t } = useT()
  const idx = series.chapters.findIndex((c) => c.id === currentId)
  const prev = series.chapters[idx - 1]
  const next = series.chapters[idx + 1]
  return (
    <span className="series-nav">
      {prev ? <Link to={`/story/${prev.id}`} className="btn btn-ghost btn-sm">← {t('prev')}</Link> : <span />}
      {next && <Link to={`/story/${next.id}`} className="btn btn-grad btn-sm">{t('next')} →</Link>}
    </span>
  )
}

// Default ah adhigam reactions ulla path oda last part ah select pannum
function bestLeaf(parts) {
  const kids = {}
  let root = null
  parts.forEach((p) => (p.parent == null ? (root = p) : (kids[p.parent] ||= []).push(p)))
  let node = root
  while (node && kids[node.id]?.length) {
    node = [...kids[node.id]].sort((a, b) => b.likes_count - a.likes_count)[0]
  }
  return node?.id ?? null
}
