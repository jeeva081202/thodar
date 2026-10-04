import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useTheme, useUnread } from '../hooks'
import { useT } from '../i18n'
import Icon from './Icon'
import Avatar from './Avatar'
import { FreeBadge } from '../pages/About'
import { GuideButton } from '../pages/Guide'
import { Sparkles } from './Decor'

export function Brand() {
  return (
    <Link to="/" className="brand">
      <motion.img src="/logo.svg" alt="" width="36" height="36"
                  whileHover={{ rotate: -8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 400 }} />
      <span>thodar</span>
    </Link>
  )
}

export function LangSwitch({ compact }) {
  const { lang, setLang } = useT()
  return (
    <div className={`lang-switch ${compact ? 'compact' : ''}`} role="group" aria-label="Language">
      {[['en', 'EN'], ['ta', 'தமிழ்']].map(([k, l]) => (
        <button key={k} className={lang === k ? 'active' : ''} onClick={() => setLang(k)}>
          {lang === k && <motion.span layoutId={compact ? 'lang-m' : 'lang-d'} className="lang-pill" />}
          <span>{l}</span>
        </button>
      ))}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const { t } = useT()
  const unread = useUnread(pathname)
  const [theme, toggleTheme] = useTheme()

  const items = [
    ['/', 'home', t('home')],
    ['/challenges', 'sparkle', t('challenges')],
    ['/leaderboard', 'trophy', t('top_writers')],
    ...(user ? [
      ['/notifications', 'bell', t('notifications'), unread],
      ['/bookmarks', 'bookmark', t('saved')],
      ['/drafts', 'edit', t('drafts')],
      [`/u/${user.username}`, 'user', t('profile')],
      ['/settings', 'settings', t('settings')],
    ] : []),
    ...(user?.is_staff ? [['/admin', 'crown', t('admin')]] : []),
    ['/about', 'heart', t('about')],
  ]

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="side-nav">
        {items.map(([to, icon, label, badge]) => (
          <NavLink key={to} to={to} end={to === '/'} className={`side-link ${to === '/admin' ? 'admin-link' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="side-active" className="side-active"
                                          transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="side-ico"><Icon name={icon} size={22} />{badge > 0 && <b className="badge">{badge > 9 ? '9+' : badge}</b>}</span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button className="side-link" onClick={() => toggleTheme()}>
          <span className="side-ico"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={22} /></span>
          <span>{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>
        </button>
      </nav>
      <LangSwitch />
      <GuideButton />
      <FreeBadge />

      {user ? (
        <>
          <motion.div className="write-wrap" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Sparkles count={5} seed={3} />
            <Link to="/new" className="btn btn-grad btn-block write-btn shine"><Icon name="pen" size={18} /> <span>{t('write')}</span></Link>
          </motion.div>
          <div className="side-user">
            <Avatar name={user.username} src={user.avatar} size={38} />
            <div className="side-user-name"><b>{user.username} {user.is_staff && '👑'}</b><span>@{user.username}</span></div>
            <button className="icon-btn" onClick={logout} title={t('logout')}><Icon name="logout" size={18} /></button>
          </div>
        </>
      ) : (
        <div className="side-auth">
          <p>{t('join_cta')}</p>
          <Link to="/register" className="btn btn-grad btn-block">{t('join')}</Link>
          <Link to="/login" className="btn btn-ghost btn-block">{t('login')}</Link>
        </div>
      )}
    </aside>
  )
}
