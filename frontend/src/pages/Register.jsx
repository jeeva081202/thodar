import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { SPOKEN, STATES, TYPES, errorText } from '../api/client'
import AuthLayout from '../components/AuthLayout'
import AvatarPicker from '../components/AvatarPicker'
import { celebrate } from '../utils/celebrate'

const YEARS = Array.from({ length: 2012 - 1940 + 1 }, (_, i) => 2012 - i)

export function Chips({ options, value, onChange, multi = true }) {
  const toggle = (k) => {
    if (!multi) return onChange(value === k ? '' : k)
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k])
  }
  return (
    <div className="chips wrap">
      {Object.entries(options).map(([k, l]) => (
        <motion.button type="button" key={k} whileTap={{ scale: 0.92 }}
                       className={`chip ${(multi ? value.includes(k) : value === k) ? 'active' : ''}`} onClick={() => toggle(k)}>
          {l}
        </motion.button>
      ))}
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const { t, lang } = useT()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [f, setF] = useState({
    username: '', email: '', password: '',
    full_name: '', state: '', city: '', languages: [lang === 'ta' ? 'ta' : 'en'], gender: '', birth_year: '',
    bio: '', interests: [],
  })
  const [avatar, setAvatar] = useState({ file: null, preview: null, preset: '', current: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const stepOk = [
    /^[A-Za-z0-9_]{3,30}$/.test(f.username) && f.password.length >= 6,
    f.full_name.trim().length >= 2 && f.state && f.languages.length > 0,
    true,
  ]
  const go = (n) => { setDir(n > step ? 1 : -1); setError(''); setStep(n) }

  const submit = async () => {
    setBusy(true); setError('')
    const form = new FormData()
    for (const [k, v] of Object.entries(f)) form.append(k, Array.isArray(v) ? v.join(',') : v)
    if (avatar.file) form.append('avatar', avatar.file, 'avatar.jpg')
    else if (avatar.preset) form.append('avatar_preset', avatar.preset)
    try {
      const r = await register(form)
      celebrate()
      if (r.pending) setPending(true)
      else nav('/')
    } catch (err) {
      setError(errorText(err))
      if (err.response?.data?.username || err.response?.data?.password) go(0)
    } finally { setBusy(false) }
  }

  if (pending) {
    return (
      <AuthLayout>
        <div className="auth">
          <h2>⏳</h2>
          <p className="pending-box">{t('pending_msg')}</p>
          <Link to="/login" className="btn btn-ghost">{t('login')}</Link>
        </div>
      </AuthLayout>
    )
  }

  const steps = [t('step_account'), t('step_about'), t('step_profile')]
  const genders = { female: t('g_female'), male: t('g_male'), other: t('g_other'), '': t('g_none') }

  return (
    <AuthLayout>
      <div className="auth wizard">
        <h2>{t('join_title')}</h2>
        <div className="wiz-steps">
          {steps.map((s, i) => (
            <button type="button" key={s} className={`wiz-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
                    onClick={() => i < step && go(i)}>
              <span className="wiz-dot">{i < step ? '✓' : i + 1}</span>{s}
            </button>
          ))}
          <motion.span className="wiz-bar" animate={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} className="wiz-body" custom={dir}
                      initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }}
                      transition={{ duration: 0.25 }}>
            {step === 0 && (
              <>
                <input className="input" placeholder={t('username')} autoComplete="username" value={f.username} onChange={set('username')} />
                <span className="field-hint">{t('username_hint')}</span>
                <input className="input" type="email" placeholder={t('email_opt')} autoComplete="email" value={f.email} onChange={set('email')} />
                <input className="input" type="password" placeholder={t('password_min')} autoComplete="new-password" value={f.password} onChange={set('password')} />
              </>
            )}
            {step === 1 && (
              <>
                <input className="input" placeholder={t('full_name')} autoComplete="name" value={f.full_name} onChange={set('full_name')} maxLength={80} />
                <div className="two">
                  <select className="input" value={f.state} onChange={set('state')}>
                    <option value="">📍 {t('select_state')}</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className="input" placeholder={t('city')} value={f.city} onChange={set('city')} maxLength={60} />
                </div>
                <label className="field-label">{t('languages_write')}</label>
                <Chips options={SPOKEN} value={f.languages} onChange={set('languages')} />
                <label className="field-label">{t('gender')}</label>
                <Chips options={genders} value={f.gender} onChange={set('gender')} multi={false} />
                <label className="field-label">{t('birth_year')}</label>
                <select className="input" value={f.birth_year} onChange={set('birth_year')}>
                  <option value="">—</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <p className="private-note">{t('private_note')}</p>
              </>
            )}
            {step === 2 && (
              <>
                <label className="field-label">{t('profile_photo')}</label>
                <AvatarPicker name={f.username} value={avatar} onChange={setAvatar} />
                <label className="field-label">{t('interests_q')}</label>
                <Chips options={Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, `${v.emoji} ${t('t_' + k)}`]))}
                       value={f.interests} onChange={set('interests')} />
                <label className="field-label">{t('bio')}</label>
                <input className="input" placeholder={t('bio_ph')} value={f.bio} onChange={set('bio')} maxLength={200} />
                <p className="muted small" style={{ margin: 0 }}>{t('terms')}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="error">{error}</p>}
        <div className="wiz-nav">
          {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>← {t('back')}</button>}
          {step < 2
            ? <button type="button" className="btn btn-grad btn-lg grow" disabled={!stepOk[step]} onClick={() => go(step + 1)}>{t('continue_btn')} →</button>
            : <button type="button" className="btn btn-grad btn-lg grow shine" disabled={busy} onClick={submit}>{busy ? '…' : t('finish')}</button>}
        </div>
        <p className="muted small">{t('have_account')} <Link to="/login" className="link">{t('login')}</Link></p>
      </div>
    </AuthLayout>
  )
}
