import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { errorText } from '../api/client'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const { t } = useT()
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await login(form.username, form.password)
      nav('/')
    } catch (err) {
      const d = err.response?.data
      setError(d?.code === 'inactive' || d?.detail?.includes?.('admin') ? d.detail
        : err.response?.status === 401 ? '❌ Username / password' : errorText(err))
      setShake((s) => s + 1)
    } finally { setBusy(false) }
  }

  return (
    <AuthLayout>
      <motion.form key={shake} onSubmit={submit} className="auth"
                   animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
        <h2>{t('welcome_back')}</h2>
        <p className="muted">{t('welcome_sub')}</p>
        <input className="input" placeholder={t('username')} autoComplete="username" value={form.username} required
               onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input" type="password" placeholder={t('password')} autoComplete="current-password" value={form.password} required
               onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-grad btn-lg shine" disabled={busy}>{busy ? '…' : t('login')}</button>
        <p className="muted small">{t('no_account')} <Link to="/register" className="link">{t('join_now')}</Link></p>
      </motion.form>
    </AuthLayout>
  )
}
