import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api, { GENRES, LANGS, TYPES, errorText, mediaUrl } from '../api/client'
import { useToast } from '../components/Toast'
import { useT } from '../i18n'
import Icon from '../components/Icon'
import SmartField, { finalizeText } from '../components/SmartField'
import { celebrate } from '../utils/celebrate'

// Write page la kaattura tiles (Love story = kadhai + love genre)
const TILES = [
  ['kadhai', 'kadhai', null], ['kavithai', 'kavithai', null], ['dialogue', 'dialogue', null],
  ['love', 'kadhai', 'love'], ['personal', 'personal', null], ['article', 'article', null], ['quote', 'quote', null],
]
const MAX = { article: 12000, quote: 300 }
const ROWS = { article: 16, quote: 3, kavithai: 10 }
const DEFAULT_GENRE = { kadhai: 'drama', kavithai: 'life', dialogue: 'comedy', personal: 'life', article: 'motivation', quote: 'motivation' }

function ImagePick({ label, value, onChange, wide }) {
  const ref = useRef(null)
  return (
    <div className={`img-pick ${wide ? 'wide' : ''}`}>
      {value.preview ? (
        <div className="img-prev">
          <img src={value.preview} alt="" />
          <button type="button" className="icon-btn" onClick={() => onChange({ file: null, preview: null, removed: true })} aria-label="Remove"><Icon name="x" size={16} /></button>
        </div>
      ) : (
        <button type="button" className="tool-btn" onClick={() => ref.current.click()}>🖼️ {label}</button>
      )}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) onChange({ file: f, preview: URL.createObjectURL(f), removed: false })
        e.target.value = ''
      }} />
    </div>
  )
}

export default function NewStory() {
  const { id } = useParams()            // /edit/:id na draft edit
  const nav = useNavigate()
  const toast = useToast()
  const { t, lang } = useT()
  const [tile, setTile] = useState(id ? 'loading' : null)
  const [f, setF] = useState({ title: '', genre: 'drama', language: lang === 'ta' ? 'ta' : 'mix', content_type: 'kadhai',
    opening: '', speaker: '', is_anonymous: false, series: '', series_title: '', challenge: '' })
  const [img, setImg] = useState({ file: null, preview: null })
  const [cover, setCover] = useState({ file: null, preview: null })
  const [mySeries, setMySeries] = useState([])
  const [challenges, setChallenges] = useState([])
  const [newSeries, setNewSeries] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }))

  useEffect(() => {
    api.get('/series/mine/').then((r) => setMySeries(r.data)).catch(() => {})
    api.get('/challenges/').then((r) => setChallenges(r.data.active)).catch(() => {})
  }, [])

  // Draft edit: load existing
  useEffect(() => {
    if (!id) return
    api.get(`/stories/${id}/tree/`).then(({ data }) => {
      const s = data.story
      const root = data.parts.find((p) => p.parent === null)
      setF((x) => ({ ...x, title: s.title, genre: s.genre, language: s.language, content_type: s.content_type,
        opening: root?.content || '', speaker: root?.speaker || '', is_anonymous: s.is_anonymous,
        series: s.series?.id || '', challenge: s.challenge?.id || '' }))
      if (root?.image) setImg({ file: null, preview: mediaUrl(root.image) })
      if (s.cover) setCover({ file: null, preview: mediaUrl(s.cover) })
      setTile(s.content_type === 'kadhai' && s.genre === 'love' ? 'love' : s.content_type)
    }).catch(() => setError(t('not_found')))
  }, [id, t])

  const chooseTile = ([key, type, genre]) => {
    setTile(key)
    setF((x) => ({ ...x, content_type: type, genre: genre || DEFAULT_GENRE[type] }))
  }

  const submit = async (status) => {
    setBusy(true); setError('')
    const data = { ...f, opening: finalizeText(f.opening), title: finalizeText(f.title), status }
    const form = new FormData()
    for (const [k, v] of Object.entries(data)) {
      if (k === 'is_anonymous') form.append(k, v ? 'true' : 'false')
      else if (v !== '' && v !== null && v !== undefined) form.append(k, v)
    }
    if (!newSeries) form.delete('series_title')
    if (img.file) form.append('image', img.file)
    else if (img.removed) form.append('remove_image', 'true')
    if (cover.file) form.append('cover', cover.file)
    else if (cover.removed) form.append('remove_cover', 'true')
    try {
      const { data: r } = id ? await api.patch(`/stories/${id}/tree/`, form) : await api.post('/stories/', form)
      const sid = id || r.id
      if (status === 'published') { celebrate(); toast(t('published')); nav(`/story/${sid}`) }
      else { toast(t('draft_saved')); nav('/drafts') }
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  if (tile === 'loading') return <div className="skeleton" style={{ height: 400 }} />

  // Step 1: content type select
  if (!tile) {
    return (
      <div className="write">
        <h1 className="page-title">{t('what_write')} ✨</h1>
        <div className="type-tiles">
          {TILES.map((tl, i) => {
            const [key, type] = tl
            const ty = TYPES[type]
            const color = key === 'love' ? '#F43F5E' : ty.color
            return (
              <motion.button key={key} type="button" className="type-tile" style={{ '--tc': color }}
                             initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                             transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                             whileHover={{ y: -5 }} whileTap={{ scale: 0.96 }} onClick={() => chooseTile(tl)}>
                <span className="tile-emoji">{key === 'love' ? '💕' : ty.emoji}</span>
                <b>{t('t_' + key)}</b>
                <span>{t('td_' + key)}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  const type = f.content_type
  const ty = TYPES[type]
  const max = MAX[type] || 2000
  const okLen = type === 'quote' ? f.opening.trim().length >= 5 : f.opening.trim().length >= 20
  const okTitle = type === 'quote' || f.title.trim()
  const fitting = challenges.filter((c) => !c.content_type || c.content_type === type)

  return (
    <form className="write" onSubmit={(e) => { e.preventDefault(); submit('published') }} style={{ '--tc': ty.color }}>
      <div className="write-head">
        <span className="type-badge" style={{ '--tc': tile === 'love' ? '#F43F5E' : ty.color }}>
          {tile === 'love' ? '💕' : ty.emoji} {t('t_' + tile)}
        </span>
        {!id && <button type="button" className="link-btn small" onClick={() => setTile(null)}>↺ {t('change_type')}</button>}
      </div>

      {type !== 'quote' && (
        <SmartField as="input" className="title-input" value={f.title} onChange={set('title')} maxLength={200}
                    placeholder={t('title_ph')} toolbar={false} />
      )}

      {type === 'article' && <ImagePick label={t('cover_image')} value={cover} onChange={setCover} wide />}

      <label>{t('language')}</label>
      <div className="seg-pills">
        {Object.entries(LANGS).map(([k, l]) => (
          <button type="button" key={k} className={f.language === k ? 'active' : ''} onClick={() => set('language')(k)}>
            {f.language === k && <motion.span layoutId="lang-pick" className="seg-pill-bg" />}
            <span>{l}</span>
          </button>
        ))}
      </div>

      <label>{t('genre')}</label>
      <div className="chips wrap">
        {Object.entries(GENRES).map(([k, g]) => (
          <motion.button type="button" key={k} whileTap={{ scale: 0.92 }}
                         className={`chip ${f.genre === k ? 'active' : ''}`} onClick={() => set('genre')(k)}>
            {g.emoji} {g.label}
          </motion.button>
        ))}
      </div>

      {type === 'dialogue' && (
        <>
          <label>{t('speaker')}</label>
          <SmartField as="input" value={f.speaker} onChange={set('speaker')} maxLength={40} placeholder={t('speaker_ph')} toolbar={false} />
        </>
      )}

      <label>{type === 'dialogue' ? '💬' : t('opening')}</label>
      <SmartField value={f.opening} onChange={set('opening')} rows={ROWS[type] || 8} maxLength={max}
                  className={`ta-${type}`} placeholder={t('opening_ph')} />

      {type !== 'quote' && type !== 'article' && <ImagePick label={t('add_image')} value={img} onChange={setImg} />}

      {type === 'personal' && (
        <label className="toggle-row">
          <input type="checkbox" checked={f.is_anonymous} onChange={set('is_anonymous')} />
          <span><b>{t('post_anon')}</b><small>{t('anon_hint')}</small></span>
        </label>
      )}

      {(type === 'kadhai' || type === 'article') && (
        <>
          <label>📚 {t('series')}</label>
          {newSeries ? (
            <div className="row-gap" style={{ marginTop: 0 }}>
              <input className="input" style={{ flex: 1 }} placeholder={t('series_name')} value={f.series_title}
                     onChange={set('series_title')} maxLength={200} />
              <button type="button" className="link-btn" onClick={() => { setNewSeries(false); set('series_title')('') }}>{t('cancel')}</button>
            </div>
          ) : (
            <div className="row-gap" style={{ marginTop: 0 }}>
              <select className="input" style={{ flex: 1 }} value={f.series} onChange={set('series')}>
                <option value="">{t('no_series')}</option>
                {mySeries.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setNewSeries(true); set('series')('') }}>{t('new_series')}</button>
            </div>
          )}
        </>
      )}

      {fitting.length > 0 && (
        <>
          <label>🎯 {t('join_challenge')}</label>
          <div className="chips wrap">
            <button type="button" className={`chip ${!f.challenge ? 'active' : ''}`} onClick={() => set('challenge')('')}>{t('no_challenge')}</button>
            {fitting.map((c) => (
              <button type="button" key={c.id} className={`chip ${String(f.challenge) === String(c.id) ? 'active' : ''}`}
                      onClick={() => set('challenge')(c.id)}>{c.emoji} {c.title}</button>
            ))}
          </div>
        </>
      )}

      {type !== 'quote' && <div className="tip">{t('tip')}</div>}
      <AnimatePresence>{error && <motion.p className="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}</AnimatePresence>
      <div className="write-foot">
        <span className="counter">{f.opening.length}/{max}</span>
        <div className="row-gap" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" disabled={busy || !f.opening.trim()} onClick={() => submit('draft')}>
            📝 {t('save_draft')}
          </button>
          <motion.button whileTap={{ scale: 0.95 }} className="btn btn-grad btn-lg shine" disabled={busy || !okLen || !okTitle}>
            <Icon name="sparkle" size={17} fill /> {busy ? t('publishing') : t('publish')}
          </motion.button>
        </div>
      </div>
    </form>
  )
}
