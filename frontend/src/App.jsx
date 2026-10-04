import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import Sidebar from './components/Sidebar'
import MobileNav, { MobileTop } from './components/MobileNav'
import RightRail from './components/RightRail'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NewStory from './pages/NewStory'
import StoryPage from './pages/StoryPage'
import BookView from './pages/BookView'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import Drafts from './pages/Drafts'
import About from './pages/About'
import Guide, { GuideSheet } from './pages/Guide'
import SeriesPage from './pages/SeriesPage'
import Challenges, { ChallengeDetail } from './pages/Challenges'
import { useAuth } from './context/AuthContext'
import { useT } from './i18n'

function Private({ children, admin }) {
  const { user, loading } = useAuth()
  const { t } = useT()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (admin && !user.is_staff) return <p className="empty">{t('admin_only')}</p>
  return children
}

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const { t } = useT()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  if (pathname.startsWith('/book/')) {
    return <Routes><Route path="/book/:partId" element={<BookView />} /></Routes>
  }
  if (pathname === '/login' || pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    )
  }

  // Story page & admin ku wide layout (right rail illa)
  const wide = pathname.startsWith('/story/') || pathname.startsWith('/admin')

  return (
    <div className={`shell ${wide ? 'shell-wide' : ''}`}>
      <div className="aurora" aria-hidden="true"><i /><i /><i /><i /></div>
      <Sidebar />
      <MobileTop />
      <motion.main key={pathname} className="main"
                   initial={{ opacity: 0, x: 26, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                   transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<Private><NewStory /></Private>} />
          <Route path="/edit/:id" element={<Private><NewStory /></Private>} />
          <Route path="/drafts" element={<Private><Drafts /></Private>} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/notifications" element={<Private><Notifications /></Private>} />
          <Route path="/bookmarks" element={<Private><Bookmarks /></Private>} />
          <Route path="/settings" element={<Private><Settings /></Private>} />
          <Route path="/admin" element={<Private admin><AdminDashboard /></Private>} />
          <Route path="*" element={<p className="empty">{t('not_found')}</p>} />
        </Routes>
      </motion.main>
      {!wide && <RightRail />}
      <MobileNav />
      <GuideSheet />
    </div>
  )
}
