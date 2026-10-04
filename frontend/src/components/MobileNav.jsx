import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../hooks'
import { useT } from '../i18n'
import Icon from './Icon'
import { Brand, LangSwitch } from './Sidebar'
import { GuideButton } from '../pages/Guide'

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

export default function MobileNav() {
  const { user } = useAuth()
  const { t } = useT()
  const me = user ? `/u/${user.username}` : '/login'
  return (
    <nav className="m-bottom">
      <NavLink to="/" end aria-label={t('home')}><Icon name="home" size={23} /></NavLink>
      <NavLink to="/leaderboard" aria-label={t('top_writers')}><Icon name="trophy" size={23} /></NavLink>
      <Link to={user ? '/new' : '/register'} className="m-write" aria-label={t('write')}><Icon name="plus" size={26} /></Link>
      <NavLink to={user ? '/settings' : '/login'} aria-label={t('settings')}><Icon name="settings" size={23} /></NavLink>
      <NavLink to={me} aria-label={t('profile')}><Icon name="user" size={23} /></NavLink>
    </nav>
  )
}
