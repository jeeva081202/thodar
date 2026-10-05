import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useTheme, useUnread } from '../hooks'
import { useT } from '../i18n'
import Icon from './Icon'
import Avatar from './Avatar'
import { Brand, LangSwitch } from './Sidebar'
import { FreeBadge } from '../pages/About'
import { GuideButton, openGuide } from '../pages/Guide'

export function MobileTop() {
  const { user } = useAuth()
  const { t } = useT()
  const { pathname } = useLocation()
  const unread = useUnread(pathname)
  return (
    <header className="m-top">
      <Brand />
      <div className="m-top-actions">
        <LangSwitch compact />
        <GuideButton compact />
        {user?.is_staff && <Link to="/admin" className="icon-btn" aria-label={t('admin')}><Icon name="crown" size={19} /></Link>}
        {user ? (
          <Link to="/notifications" className="icon-btn" aria-label={t('notifications')}>
            <Icon name="bell" size={19} />{unread > 0 && <b className="badge">{unread > 9 ? '9+' : unread}</b>}
          </Link>
        ) : <Link to="/login" className="btn btn-grad btn-sm">{t('login')}</Link>}
      </div>
    </header>
  )
}

/* ☰ More — mobile la sidebar la irukkura ellaa menu um inga */
function MoreSheet({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t, lang } = useT()
  const [theme, toggleTheme] = useTheme()
  const ta = lang === 'ta'

  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = prev }
  }, [open, onClose])

  const items = [
    ['/challenges', 'sparkle', t('challenges')],
    ['/leaderboard', 'trophy', t('top_writers')],
    ...(user ? [
      ['/notifications', 'bell', t('notifications')],
      ['/bookmarks', 'bookmark', t('saved')],
      ['/drafts', 'edit', t('drafts')],
      [`/u/${user.username}`, 'user', t('profile')],
      ['/settings', 'settings', t('settings')],
    ] : []),
    ...(user?.is_staff ? [['/admin', 'crown', t('admin')]] : []),
    ['/about', 'heart', t('about')],
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" onClick={onClose}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="sheet more-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
                      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
            <div className="sheet-grip" />
            <button className="sheet-close" onClick={onClose} aria-label="Close">✕</button>

            {user ? (
              <Link to={`/u/${user.username}`} className="more-user" onClick={onClose}>
                <Avatar name={user.username} src={user.avatar} size={44} ring />
                <div><b>{user.username} {user.is_staff && '👑'}</b><span>@{user.username}</span></div>
              </Link>
            ) : (
              <div className="more-user guest">
                <b>{t('join_cta')}</b>
              </div>
            )}

            <div className="more-grid">
              {items.map(([to, icon, label], i) => (
                <motion.div key={to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                  <NavLink to={to} className="more-item" onClick={onClose}>
                    <span className="more-ico"><Icon name={icon} size={22} /></span>
                    <span>{label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>

            <div className="more-row">
              <button className="more-pill" onClick={() => { onClose(); setTimeout(openGuide, 250) }}>
                📘 {ta ? 'தொடர் வழிமுறைகள்' : 'Thodar Instructions'}
              </button>
              <button className="more-pill" onClick={() => toggleTheme()}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /> {theme === 'dark' ? t('light_mode') : t('dark_mode')}
              </button>
            </div>

            <div className="more-row"><LangSwitch /></div>
            <FreeBadge />

            {user ? (
              <button className="btn btn-ghost btn-block more-logout" onClick={() => { onClose(); logout() }}>
                <Icon name="logout" size={18} /> {t('logout')}
              </button>
            ) : (
              <div className="more-row">
                <Link to="/register" className="btn btn-grad btn-block" onClick={onClose}>{t('join')}</Link>
                <Link to="/login" className="btn btn-ghost btn-block" onClick={onClose}>{t('login')}</Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function MobileNav() {
  const { user } = useAuth()
  const { t, lang } = useT()
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  useEffect(() => { setMore(false) }, [pathname])
  const me = user ? `/u/${user.username}` : '/login'
  return (
    <>
      <nav className="m-bottom">
        <NavLink to="/" end aria-label={t('home')}><Icon name="home" size={23} /></NavLink>
        <NavLink to="/challenges" aria-label={t('challenges')}><Icon name="sparkle" size={23} /></NavLink>
        <Link to={user ? '/new' : '/register'} className="m-write" aria-label={t('write')}><Icon name="plus" size={26} /></Link>
        <NavLink to={me} aria-label={t('profile')}><Icon name="user" size={23} /></NavLink>
        <button className={`m-more ${more ? 'active' : ''}`} onClick={() => setMore(true)} aria-label={lang === 'ta' ? 'மேலும்' : 'More'}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
        </button>
      </nav>
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </>
  )
}
