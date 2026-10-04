import { useState } from 'react'
import api, { errorText } from '../api/client'
import { useT } from '../i18n'
import { useToast } from './Toast'
import Modal from './Modal'

const REASONS = ['spam', 'abuse', 'adult', 'copy', 'other']

export default function ReportModal({ partId, onClose }) {
  const { t } = useT()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    try {
      await api.post(`/parts/${partId}/report/`, { reason, note })
      toast(t('report_sent')); onClose()
    } catch (err) { toast(errorText(err), 'err') } finally { setBusy(false) }
  }

  return (
    <Modal open={!!partId} onClose={onClose} title={`🚩 ${t('report_title')}`}>
      <div className="chips wrap">
        {REASONS.map((r) => (
          <button key={r} className={`chip ${reason === r ? 'active' : ''}`} onClick={() => setReason(r)}>{t('r_' + r)}</button>
        ))}
      </div>
      <input className="input" placeholder={t('note_ph')} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      <button className="btn btn-grad" disabled={!reason || busy} onClick={send}>{t('send')}</button>
    </Modal>
  )
}
