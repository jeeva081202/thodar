import { useRef, useState } from 'react'
import { STATES, SPOKEN, TYPES, errorText, mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { useToast } from './Toast'
import AvatarPicker from './AvatarPicker'
import ImageCropper from './ImageCropper'
import Modal from './Modal'
import Icon from './Icon'
import { Chips } from '../pages/Register'

const YEARS = Array.from({ length: 2012 - 1940 + 1 }, (_, i) => 2012 - i)
const list = (s) => (s ? s.split(',').filter(Boolean) : [])

export default function EditProfile() {
  const { user, updateMe } = useAuth()
  const { t } = useT()
  const toast = useToast()
  const [f, setF] = useState({
    full_name: user.full_name || '', state: user.state || '', city: user.city || '', bio: user.bio || '',
    languages: list(user.languages), interests: list(user.interests),
    gender: user.gender || '', birth_year: user.birth_year || '',
  })
  const [avatar, setAvatar] = useState({ file: null, preview: null, preset: user.avatar_preset || '', current: user.avatar })
  const [cover, setCover] = useState({ raw: null, blob: null, preview: user.cover ? mediaUrl(user.cover) : null })
  const coverInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const save = async () => {
    setBusy(true)
    const form = new FormData()
    for (const [k, v] of Object.entries(f)) form.append(k, Array.isArray(v) ? v.join(',') : v)
    if (avatar.file) form.append('avatar', avatar.file, 'avatar.jpg')
    else if (avatar.preset !== (user.avatar_preset || '') || (avatar.preset && user.avatar?.startsWith('url:'))) form.append('avatar_preset', avatar.preset)
    if (cover.blob) form.append('cover', cover.blob, 'cover.jpg')
    else if (!cover.preview && user.cover) form.append('remove_cover', 'true')
    try {
      await updateMe(form)
      setAvatar((a) => ({ ...a, file: null }))
      setCover((c) => ({ ...c, blob: null }))
      toast(t('updated'))
    } catch (err) { toast(errorText(err), 'err') } finally { setBusy(false) }
  }

  const genders = { female: t('g_female'), male: t('g_male'), other: t('g_other'), '': t('g_none') }

  return (
    <section className="card edit-profile">
      <h4><Icon name="user" size={18} /> {t('edit_profile')}</h4>

      <label className="set-label">{t('cover_photo')}</label>
      <div className="cover-edit" style={cover.preview ? { backgroundImage: `url(${cover.preview})` } : undefined}>
        <button type="button" className="btn btn-ghost btn-sm glassy" onClick={() => coverInput.current.click()}>📷 {t('change_cover')}</button>
        {cover.preview && <button type="button" className="btn btn-ghost btn-sm glassy" onClick={() => setCover({ raw: null, blob: null, preview: null })}>{t('remove')}</button>}
        <input ref={coverInput} type="file" accept="image/*" hidden
               onChange={(e) => { const x = e.target.files?.[0]; if (x) setCover((c) => ({ ...c, raw: x })); e.target.value = '' }} />
      </div>
      <Modal open={!!cover.raw} onClose={() => setCover((c) => ({ ...c, raw: null }))} title={`🖼️ ${t('cover_photo')}`}>
        {cover.raw && <ImageCropper file={cover.raw} aspect={3} outW={1500} onCancel={() => setCover((c) => ({ ...c, raw: null }))}
                                    onDone={(b) => setCover({ raw: null, blob: b, preview: URL.createObjectURL(b) })} />}
      </Modal>

      <label className="set-label">{t('profile_photo')}</label>
      <AvatarPicker name={user.username} value={avatar} onChange={setAvatar} />

      <label className="set-label">{t('full_name')}</label>
      <input className="input" value={f.full_name} onChange={set('full_name')} maxLength={80} />
      <label className="set-label">{t('bio')}</label>
      <input className="input" value={f.bio} onChange={set('bio')} maxLength={200} placeholder={t('bio_ph')} />
      <label className="set-label">{t('location')}</label>
      <div className="two">
        <select className="input" value={f.state} onChange={set('state')}>
          <option value="">📍 {t('select_state')}</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="input" placeholder={t('city')} value={f.city} onChange={set('city')} maxLength={60} />
      </div>
      <label className="set-label">{t('languages_write')}</label>
      <Chips options={SPOKEN} value={f.languages} onChange={set('languages')} />
      <label className="set-label">{t('interests_q')}</label>
      <Chips options={Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, `${v.emoji} ${t('t_' + k)}`]))}
             value={f.interests} onChange={set('interests')} />
      <label className="set-label">{t('gender')}</label>
      <Chips options={genders} value={f.gender} onChange={set('gender')} multi={false} />
      <label className="set-label">{t('birth_year')}</label>
      <select className="input" value={f.birth_year || ''} onChange={set('birth_year')}>
        <option value="">—</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <p className="private-note">{t('private_note')}</p>
      <div className="row-gap"><button className="btn btn-grad" disabled={busy} onClick={save}>{busy ? '…' : t('save')}</button></div>
    </section>
  )
}
