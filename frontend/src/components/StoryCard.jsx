import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { GENRES, LANGS, TYPES, mediaUrl } from '../api/client'
import { useT } from '../i18n'
import { timeAgo } from '../utils/time'
import Avatar from './Avatar'
import Icon from './Icon'

export function TypeBadge({ type, small }) {
  const { t } = useT()
  const ty = TYPES[type] || TYPES.kadhai
  return (
    <span className={`type-badge ${small ? 'small' : ''}`} style={{ '--tc': ty.color }}>
      {ty.emoji} {t('t_' + type)}
    </span>
  )
}

/** Feed card — content type ku etha maadhiri vera vera look */
// Mouse follow panna card konjam 3D ah saayum + gloss light
function useTilt() {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const sx = useSpring(rx, { stiffness: 200, damping: 18 })
  const sy = useSpring(ry, { stiffness: 200, damping: 18 })
  const fine = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  const onMove = (e) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    rx.set((0.5 - py) * 7)
    ry.set((px - 0.5) * 7)
    e.currentTarget.style.setProperty('--mx', `${px * 100}%`)
    e.currentTarget.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }
  return { style: { rotateX: sx, rotateY: sy, transformPerspective: 900 }, onMouseMove: onMove, onMouseLeave: onLeave }
}

export default function StoryCard({ story, index = 0 }) {
  const { t } = useT()
  const tilt = useTilt()
  const type = story.content_type || 'kadhai'
  const ty = TYPES[type] || TYPES.kadhai
  const g = GENRES[story.genre]
  const ta = story.language === 'ta' ? 'ta' : undefined
  const anon = story.created_by === 'anonymous'

  const body = (() => {
    if (type === 'quote') {
      return <blockquote className="card-quote serif" lang={ta}>“{story.opening}”</blockquote>
    }
    if (type === 'kavithai') {
      return (
        <>
          <h3 lang={ta}>{story.title}</h3>
          <p className="card-poem serif" lang={ta}>{story.opening.split('\n').slice(0, 6).join('\n')}{story.opening.split('\n').length > 6 ? '\n…' : ''}</p>
        </>
      )
    }
    if (type === 'dialogue') {
      return (
        <>
          <h3 lang={ta}>{story.title}</h3>
          <div className="card-bubble"><b>{story.speaker || '…'}</b><span lang={ta}>{story.opening.slice(0, 140)}{story.opening.length > 140 ? '…' : ''}</span></div>
        </>
      )
    }
    return (
      <>
        <h3 lang={ta}>{story.title}</h3>
        <p className="post-quote" lang={ta}>{story.opening.slice(0, 200)}{story.opening.length >= 200 ? '…' : ''}</p>
      </>
    )
  })()

  return (
    <motion.div className="card-wrap" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(index, 8) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                {...tilt}>
      <Link to={`/story/${story.id}`} className={`post tcard t-${type}`} style={{ '--tc': ty.color }}>
        <span className="card-gloss" aria-hidden="true" />
        {story.cover && <img className="card-cover" src={mediaUrl(story.cover)} alt="" loading="lazy" />}
        <div className="post-head">
          <Avatar name={story.created_by} src={story.avatar} size={34} />
          <div className="post-who">
            <b>{anon ? `🎭 ${t('anonymous')}` : `@${story.created_by}`}</b>
            <span>{timeAgo(story.created_at)}{type === 'article' && ` · ${t('min_read', { n: story.reading_time })}`}</span>
          </div>
          <TypeBadge type={type} small />
        </div>
        {body}
        <div className="card-tags">
          {story.is_winner && <span className="mini-tag win">🏆 {t('winner')}</span>}
          {story.is_featured && <span className="mini-tag">⭐</span>}
          {story.series_title && <span className="mini-tag">📚 {story.series_title} · {t('chapter_n', { n: story.chapter })}</span>}
          {story.challenge_title && <span className="mini-tag">🎯 {story.challenge_title}</span>}
          {g && <span className="mini-tag">{g.emoji} {g.label}</span>}
          <span className="mini-tag">{LANGS[story.language]}</span>
        </div>
        <div className="post-foot">
          <span><Icon name="heart" size={16} /> {story.likes_count ?? 0}</span>
          {ty.canContinue && <span><Icon name="branch" size={16} /> {story.parts_count}</span>}
          <span><Icon name="comment" size={16} /> {story.comments_count ?? 0}</span>
          {story.views > 0 && <span><Icon name="eye" size={16} /> {story.views}</span>}
        </div>
      </Link>
    </motion.div>
  )
}
