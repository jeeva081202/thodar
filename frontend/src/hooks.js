import { useEffect, useState } from 'react'
import api from './api/client'
import { useAuth } from './context/AuthContext'

export const ACCENTS = [
  { key: 'peacock', name: 'Peacock 🦚', colors: ['#14B8A6', '#0F766E', '#2563EB', '#F59E0B'] },
  { key: 'candy', name: 'Candy', colors: ['#FF4D8D', '#7C5CFF', '#0EA5E9'] },
  { key: 'sunset', name: 'Sunset', colors: ['#8B5CF6', '#EC4899', '#F97316'] },
  { key: 'ocean', name: 'Ocean', colors: ['#06B6D4', '#3B82F6', '#6366F1'] },
  { key: 'forest', name: 'Forest', colors: ['#10B981', '#84CC16', '#EAB308'] },
  { key: 'neon', name: 'Neon', colors: ['#D946EF', '#8B5CF6', '#22D3EE'] },
  { key: 'rose', name: 'Rose Gold', colors: ['#F43F5E', '#FB923C', '#FBBF24'] },
]

const save = (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

// Unread notification count — 30 second ku oru thadava refresh
export function useUnread(pathname) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!user) return
    let alive = true
    const load = () => api.get('/notifications/unread/')
      .then((r) => alive && setCount(r.data.count)).catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [user, pathname])
  return user ? count : 0
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const toggle = (to) => {
    const t = typeof to === 'string' ? to : theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = t
    save('thodar-theme', t)
    setTheme(t)
  }
  return [theme, toggle]
}

export function useAccent() {
  const [accent, setAccentState] = useState(() => document.documentElement.dataset.accent || 'peacock')
  const setAccent = (a) => {
    document.documentElement.dataset.accent = a
    save('thodar-accent', a)
    setAccentState(a)
  }
  return [accent, setAccent]
}

// Admin site announcement + settings (oru thadava load)
let siteCache = null
export function useSite() {
  const [site, setSite] = useState(siteCache)
  useEffect(() => {
    if (siteCache) return
    api.get('/site/').then((r) => { siteCache = r.data; setSite(r.data) }).catch(() => {})
  }, [])
  return site
}
