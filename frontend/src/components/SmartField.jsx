import { useLayoutEffect, useRef, useState } from 'react'
import { toTamil, convertText } from '../utils/tamil'
import { useT } from '../i18n'
import EmojiPicker from './EmojiPicker'

// Tamil typing on/off ellaa editors kum common (localStorage la save)
let tamilOn = (() => { try { return localStorage.getItem('tamilTyping') === '1' } catch { return false } })()
const listeners = new Set()
function setTamilGlobal(v) {
  tamilOn = v
  try { localStorage.setItem('tamilTyping', v ? '1' : '0') } catch { /* ignore */ }
  listeners.forEach((fn) => fn(v))
}
function useTamil() {
  const [on, setOn] = useState(tamilOn)
  useLayoutEffect(() => { listeners.add(setOn); return () => listeners.delete(setOn) }, [])
  return [on, setTamilGlobal]
}

const DELIM = /[\s.,!?;:)"'”’]/
const finishWord = (text) => text.replace(/[A-Za-z]+$/, (w) => toTamil(w))

/**
 * Textarea / input with: தமிழ் typing (Thanglish → Tamil on space), emoji picker, live preview.
 * as="input" na Enter press panna onEnter(finalText) call aagum.
 */
export default function SmartField({ value, onChange, as = 'textarea', onEnter, className = '', toolbar = true, ...rest }) {
  const { t } = useT()
  const [tamil, setTamil] = useTamil()
  const ref = useRef(null)
  const caret = useRef(null)

  useLayoutEffect(() => {
    if (caret.current != null && ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  })

  const handleChange = (e) => {
    const v = e.target.value
    const pos = e.target.selectionStart ?? v.length
    const type = e.nativeEvent?.inputType || ''
    const ch = v[pos - 1]
    if (tamil && type.startsWith('insert') && ch && (DELIM.test(ch) || ch === '\n')) {
      const before = v.slice(0, pos - 1)
      const m = before.match(/[A-Za-z]+$/)
      if (m) {
        const nb = before.slice(0, -m[0].length) + toTamil(m[0])
        caret.current = nb.length + 1
        return onChange(nb + ch + v.slice(pos))
      }
    }
    onChange(v)
  }

  const insert = (txt) => {
    const el = ref.current
    const s = el?.selectionStart ?? value.length
    const e = el?.selectionEnd ?? value.length
    const nv = value.slice(0, s) + txt + value.slice(e)
    caret.current = s + txt.length
    onChange(nv)
    el?.focus()
  }

  const onKeyDown = (e) => {
    if (as === 'input' && e.key === 'Enter') {
      e.preventDefault()
      const final = tamil ? finishWord(value) : value
      if (final !== value) onChange(final)
      onEnter?.(final)
    }
  }

  const trailing = tamil ? value.match(/[A-Za-z]+$/)?.[0] : null
  const hasLatin = tamil && /[A-Za-z]/.test(value)
  const Tag = as

  return (
    <div className={`smart ${as === 'input' ? 'smart-input' : ''}`}>
      <Tag ref={ref} value={value} onChange={handleChange} onKeyDown={onKeyDown}
           className={`input ${as === 'textarea' ? 'textarea' : ''} ${className}`}
           autoCapitalize={tamil ? 'off' : undefined} autoCorrect={tamil ? 'off' : undefined}
           spellCheck={tamil ? false : undefined} lang={tamil ? 'ta' : undefined} {...rest} />
      {toolbar && (
        <div className="smart-bar">
          <button type="button" className={`tool-btn tamil-toggle ${tamil ? 'on' : ''}`} onClick={() => setTamil(!tamil)}
                  title={t('tamil_hint')} aria-pressed={tamil}>
            <span className="ta-glyph">அ</span> {as === 'textarea' && <span className="tool-label">{t('tamil_typing')}</span>}
          </button>
          <EmojiPicker onPick={insert} />
          {trailing && <span className="translit-preview">{trailing} → <b>{toTamil(trailing)}</b></span>}
          {hasLatin && !trailing && as === 'textarea' && (
            <button type="button" className="tool-btn small" onClick={() => onChange(convertText(value))}>A→அ</button>
          )}
        </div>
      )}
      {tamil && as === 'textarea' && <p className="smart-hint">{t('tamil_hint')}</p>}
    </div>
  )
}

/** Submit pannumbodhu kadaisi word ah convert panna (Tamil mode on irundha mattum) */
export const finalizeText = (text) => (tamilOn ? finishWord(text) : text)
