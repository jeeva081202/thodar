import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useT } from '../i18n'
import Avatar, { PRESETS } from './Avatar'
import ImageCropper from './ImageCropper'
import Modal from './Modal'
import Icon from './Icon'

/**
 * value: { file: Blob|null, preview: string|null, preset: string, current: 'url:..'|'preset:..'|'' }
 * onChange(newValue)
 */
export default function AvatarPicker({ name, value, onChange }) {
  const { t } = useT()
  const input = useRef(null)
  const [raw, setRaw] = useState(null)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (f) setRaw(f)
    e.target.value = ''
  }

  const shown = value.preview ? null : value.preset ? `preset:${value.preset}` : value.current

  return (
    <div className="avatar-picker">
      <div className="ap-current">
        {value.preview
          ? <img className="avatar avatar-ring" src={value.preview} alt="" style={{ width: 96, height: 96 }} />
          : <Avatar name={name || '?'} src={shown} size={96} ring />}
        <button type="button" className="btn btn-grad btn-sm" onClick={() => input.current.click()}>
          <Icon name="share" size={15} /> {t('upload_photo')}
        </button>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
      </div>
      <p className="muted small" style={{ margin: '10px 0 8px' }}>{t('or_pick')}</p>
      <div className="preset-grid">
        {Object.keys(PRESETS).map((k, i) => (
          <motion.button type="button" key={k} className={`preset ${value.preset === k && !value.preview ? 'on' : ''}`}
                         initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.015 }}
                         whileHover={{ scale: 1.12, rotate: -6 }} whileTap={{ scale: 0.9 }}
                         onClick={() => onChange({ ...value, preset: k, file: null, preview: null })}>
            <Avatar src={`preset:${k}`} size={44} />
          </motion.button>
        ))}
      </div>
      <Modal open={!!raw} onClose={() => setRaw(null)} title={`📸 ${t('profile_photo')}`}>
        {raw && (
          <ImageCropper file={raw} onCancel={() => setRaw(null)}
                        onDone={(blob) => {
                          onChange({ ...value, file: blob, preview: URL.createObjectURL(blob), preset: '' })
                          setRaw(null)
                        }} />
        )}
      </Modal>
    </div>
  )
}
