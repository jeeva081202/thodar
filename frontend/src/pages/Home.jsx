import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api, { GENRES, LANGS, TYPES } from '../api/client'
import { ChallengeCard } from './Challenges'
import StoryCard from '../components/StoryCard'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useSite } from '../hooks'
import { Feathers, Sparkles } from '../components/Decor'

function Announcement() {
  const site = useSite()
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem('ann-hide') === site?.announcement } catch { return false }
  })
  if (!site?.announcement || hidden) return null
  return (
    <motion.div className="announce" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Icon name="megaphone" size={18} />
      <span>{site.announcement}</span>
      <button className="link-btn" aria-label="Close" onClick={() => {
        setHidden(true)
        try { sessionStorage.setItem('ann-hide', site.announcement) } catch { /* ignore */ }
      }}><Icon name="x" size={16} /></button>
    </motion.div>
  )
}

function LiveChallenge() {
  const [c, setC] = useState(null)
  useEffect(() => { api.get('/challenges/').then((r) => setC(r.data.active[0] || null)).catch(() => {}) }, [])
  return c ? <div style={{ marginBottom: 16 }}><ChallengeCard c={c} /></div> : null
}

function Featured() {
  const { t } = useT()
  const [items, setItems] = useState([])
  useEffect(() => { api.get('/stories/', { params: { featured: 1 } }).then((r) => setItems(r.data.results)).catch(() => {}) }, [])
  if (!items.length) return null
  return (
    <section className="featured">
      <h3 className="featured-title"><span className="gold-text">⭐ {t('featured')}</span></h3>
      <div className="featured-row">
        {items.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
            <Link to={`/story/${s.id}`} className={`feat-card fc-${i % 4}`}>
              <span className="feat-emoji">{GENRES[s.genre]?.emoji}</span>
              <b lang={s.language === 'ta' ? 'ta' : undefined}>{s.title}</b>
              <span className="feat-meta">@{s.created_by} · ♥ {s.likes_count} · {s.parts_count} {t('parts')}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { t } = useT()
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') || ''
  const ctype = params.get('type') || ''
  const [lang, setLang] = useState('')
  const [stories, setStories] = useState([])
  const [next, setNext] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('latest')
  const [loading, setLoading] = useState(true)

  const setFilter = (next) => {
    const q = { type: ctype, genre, ...next }
    setParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v)), { replace: true })
  }
  const setGenre = (g) => setFilter({ genre: g })

  useEffect(() => {
    let alive = true
    const q = { genre, search, lang, type: ctype }
    if (tab === 'popular') q.sort = 'popular'
    if (tab === 'following') q.feed = 'following'
    const tm = setTimeout(() => {
      setLoading(true)
      api.get('/stories/', { params: q })
        .then((r) => { if (alive) { setStories(r.data.results); setNext(r.data.next) } })
        .finally(() => alive && setLoading(false))
    }, search ? 250 : 0)
    return () => { alive = false; clearTimeout(tm) }
  }, [genre, search, tab, lang, ctype])

  const loadMore = async () => {
    const { data } = await api.get(next)
    setStories((s) => [...s, ...data.results])
    setNext(data.next)
  }

  const tabs = [['latest', 'clock', t('latest')], ['popular', 'flame', t('popular')],
    ...(user ? [['following', 'users', t('following')]] : [])]

  return (
    <>
      <Announcement />
      {user ? (
        <motion.div whileHover={{ scale: 1.01 }}>
          <Link to="/new" className="composer">
            <Avatar name={user.username} src={user.avatar} size={40} />
            <span className="composer-fake">{t('composer', { name: user.username })}</span>
            <span className="btn btn-grad btn-sm shine"><Icon name="pen" size={15} /> {t('write')}</span>
          </Link>
        </motion.div>
      ) : (
        <section className="hero">
          <Feathers count={4} seed={5} />
          <Sparkles count={9} seed={11} />
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {t('tagline_1')}<br />
            <motion.span className="serif gold-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                         transition={{ delay: 0.35, duration: 0.8 }}>{t('tagline_2')}</motion.span>
          </motion.h1>
          <p>{t('hero_sub')}</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-grad btn-lg shine">{t('join_free')}</Link>
            <Link to="/login" className="btn btn-ghost btn-lg">{t('login')}</Link>
          </div>
          <div className="hero-langs"><span>தமிழ்</span><span>English</span><span>Tanglish</span><span>💛 100% free</span></div>
        </section>
      )}

      <LiveChallenge />
      <Featured />

      <div className="type-tabs">
        <button className={!ctype && genre !== 'love' ? 'active' : ''} onClick={() => setFilter({ type: '', genre: '' })}>✨ {t('t_all')}</button>
        {Object.entries(TYPES).map(([k, ty]) => (
          <motion.button key={k} whileTap={{ scale: 0.92 }} className={ctype === k ? 'active' : ''} style={{ '--tc': ty.color }}
                         onClick={() => setFilter({ type: ctype === k ? '' : k })}>
            {ty.emoji} {t('t_' + k)}
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.92 }} className={genre === 'love' ? 'active' : ''} style={{ '--tc': '#F43F5E' }}
                       onClick={() => setFilter({ genre: genre === 'love' ? '' : 'love' })}>
          💕 {t('t_love')}
        </motion.button>
      </div>

      <div className="feed-tabs">
        {tabs.map(([k, icon, label]) => (
          <button key={k} className={`feed-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            <Icon name={icon} size={17} /> {label}
            {tab === k && <motion.span layoutId="feed-underline" className="feed-underline" />}
          </button>
        ))}
      </div>

      <div className="search-wrap">
        <Icon name="search" size={18} />
        <input className="input" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="chips">
        <button className={`chip ${!genre && !lang ? 'active' : ''}`} onClick={() => { setGenre(''); setLang('') }}>{t('all')}</button>
        {Object.entries(LANGS).map(([k, l]) => (
          <button key={k} className={`chip chip-lang ${lang === k ? 'active' : ''}`} onClick={() => setLang(lang === k ? '' : k)}>
            <Icon name="globe" size={14} /> {l}
          </button>
        ))}
        <span className="chip-sep" />
        {Object.entries(GENRES).map(([k, g]) => (
          <button key={k} className={`chip ${genre === k ? 'active' : ''}`} onClick={() => setGenre(genre === k ? '' : k)}>
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="sk" className="masonry" exit={{ opacity: 0 }}>{[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</motion.div>
        ) : stories.length === 0 ? (
          <motion.p key="empty" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tab === 'following'
              ? <>{t('empty_following')}<br /><Link to="/leaderboard" className="grad-text"><b>{t('follow_top')}</b></Link></>
              : t('empty_search')}
          </motion.p>
        ) : (
          <motion.div key={`${tab}-${genre}-${lang}-${ctype}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="masonry">{stories.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</div>
            {next && <div className="more"><button className="btn btn-ghost" onClick={loadMore}>{t('load_more')}</button></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
