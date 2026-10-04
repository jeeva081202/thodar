import { createContext, useContext, useEffect, useState } from 'react'
import api, { tokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Login session auto-restore (Logout click pannina mattum dhaan veliya pogum)
    if (tokens.access() || tokens.refresh()) {
      api.get('/auth/me/')
        .then((r) => setUser(r.data))
        .catch((e) => { if (e.response?.status === 401) tokens.clear() })   // server down na logout pannaadhu
        .finally(() => setLoading(false))
    } else setLoading(false)

    // Token cancel aana (block / expire) illa vera tab la logout pannina
    const out = () => setUser(null)
    const onStorage = (e) => { if (e.key === 'refresh' && !e.newValue) out() }
    window.addEventListener('thodar:logout', out)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('thodar:logout', out); window.removeEventListener('storage', onStorage) }
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    tokens.set(data)
    const me = await api.get('/auth/me/')
    setUser(me.data)
  }

  // form: FormData (username, password, profile fields, avatar file…)
  const register = async (form) => {
    const { data } = await api.post('/auth/register/', form)
    if (data.pending) return { pending: true }   // admin approval venum
    await login(form.get('username'), form.get('password'))
    return { pending: false }
  }

  const logout = () => {
    const refresh = tokens.refresh()
    if (refresh) api.post('/auth/logout/', { refresh }).catch(() => {})   // server la token cancel
    tokens.clear()
    setUser(null)
  }

  // patch: plain object or FormData (photo upload)
  const updateMe = async (patch) => {
    const { data } = await api.patch('/auth/me/', patch)
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
