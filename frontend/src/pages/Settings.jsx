import { useState } from 'react'
import { motion } from 'motion/react'
import api, { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { ACCENTS, useAccent, useTheme } from '../hooks'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import EditProfile from '../components/EditProfile'
import { FreeBadge } from './About'

export default function Settings() {
  const { t, lang, setLang } = useT()
  const { logout } = useAuth()
  const toast = useToast()
  const [theme, setTheme] = useTheme()
  const [accent, setAccent] = useAccent()
  const [pw, setPw] = useState({ old_password: '', new_password: '' })

  const changePw = async (e) => {
    e.preventDefault()
    try {
      await api.post('/auth/password/', pw)
      setPw({ old_password: '', new_password: '' }); toast(t('password_updated'))
    } catch (err) { toast(errorText(err), 'err') }
  }

  return (
    <div className="settings-stack">
      <h1 className="page-title">{t('settings')}</h1>

      <section className="card">
        <h4><Icon name="palette" size={18} /> {t('appearance')}</h4>
        <label className="set-label">{t('theme')}</label>
        <div className="theme-picks">
          {[['dark', '🌙', t('dark_mode')], ['light', '☀️', t('light_mode')]].map(([k, e, l]) => (
            <button key={k} className={`theme-pick tp-${k} ${theme === k ? 'active' : ''}`} onClick={() => setTheme(k)}>
              <span className="tp-preview"><i /><i /><i /></span>{e} {l}
            </button>
          ))}
        </div>
        <label className="set-label">{t('accent')}</label>
        <div className="accent-picks">
          {ACCENTS.map((a) => (
            <motion.button key={a.key} whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}
                           className={`accent-pick ${accent === a.key ? 'active' : ''}`} onClick={() => setAccent(a.key)}>
              <span className="accent-swatch" style={{ background: `linear-gradient(135deg, ${a.colors.join(',')})` }}>
                {accent === a.key && <Icon name="check" size={18} />}
              </span>
              {a.name}
            </motion.button>
          ))}
        </div>
        <label className="set-label">{t('ui_language')}</label>
        <div className="seg-pills">
          {[['en', 'English'], ['ta', 'தமிழ்']].map(([k, l]) => (
            <button key={k} className={lang === k ? 'active' : ''} onClick={() => setLang(k)}>
              {lang === k && <motion.span layoutId="set-lang" className="seg-pill-bg" />}<span>{l}</span>
            </button>
          ))}
        </div>
      </section>

      <EditProfile />

      <form className="card" onSubmit={changePw}>
        <h4><Icon name="lock" size={18} /> {t('change_password')}</h4>
        <input className="input" type="password" autoComplete="current-password" placeholder={t('old_password')}
               value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} required />
        <input className="input" type="password" autoComplete="new-password" placeholder={t('new_password')} minLength={8}
               value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required style={{ marginTop: 8 }} />
        <div className="row-gap"><button className="btn btn-grad btn-sm">{t('update_password')}</button></div>
      </form>

      <FreeBadge />
      <button className="btn btn-ghost" onClick={logout}><Icon name="logout" size={16} /> {t('logout')}</button>
    </div>
  )
}
