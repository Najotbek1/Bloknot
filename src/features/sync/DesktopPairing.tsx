import { useEffect, useState } from 'react'
import { db } from '../../core/db/schema'
import { answerSyncRequest, encodePairing, generateKey, PAIRING_TTL_MS } from '../../core/sync/lan'
import type { MergeReport } from '../../core/sync/merge'
import { t } from '../../i18n'
import type { DesktopApi } from '../../platform/desktop'
import { QrCode } from './QrCode'

type Phase = 'starting' | 'waiting' | 'syncing' | 'done' | 'expired' | 'error'

/** The computer's side: a one-off local server and its QR code, valid for a few minutes. */
export function DesktopPairing({ api, onClose }: { api: DesktopApi; onClose: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<Phase>('starting')
  const [pairing, setPairing] = useState<{ text: string; expiresAt: number } | null>(null)
  const [report, setReport] = useState<MergeReport | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    const key = generateKey()
    const unsubscribe = api.onSyncRequest(async (body) => {
      if (active) setPhase('syncing')
      const answer = await answerSyncRequest(db, key, body, __APP_VERSION__)
      if (active) {
        if (answer.report) setReport(answer.report)
        // A refused request (another device, an old code) leaves the code waiting.
        setPhase(answer.report ? 'done' : 'waiting')
      }
      return answer
    })
    api.startSync().then(
      ({ hosts, port }) => {
        if (!active) return
        if (hosts.length === 0) {
          setError(t('sync.noNetwork'))
          setPhase('error')
          return
        }
        const started = Date.now()
        setNow(started)
        setPairing({ text: encodePairing({ hosts, port, key }), expiresAt: started + PAIRING_TTL_MS })
        setPhase('waiting')
      },
      (err: unknown) => {
        if (!active) return
        setError(t('sync.error.other', { error: err instanceof Error ? err.message : String(err) }))
        setPhase('error')
      },
    )
    return () => {
      active = false
      unsubscribe()
      void api.stopSync()
    }
  }, [api, attempt])

  useEffect(() => {
    if (phase !== 'waiting' || !pairing) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= pairing.expiresAt) {
        setPhase('expired')
        void api.stopSync()
      }
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [api, phase, pairing])

  function again() {
    setPairing(null)
    setReport(null)
    setPhase('starting')
    setNow(Date.now())
    setAttempt((n) => n + 1)
  }

  const left = pairing ? Math.max(0, Math.ceil((pairing.expiresAt - now) / 1000)) : 0
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`

  return (
    <div className="pairing">
      {phase === 'starting' && <p role="status">{t('sync.starting')}</p>}
      {(phase === 'waiting' || phase === 'syncing') && pairing && (
        <>
          <QrCode text={pairing.text} label={t('sync.qrLabel')} />
          <p role="status">{phase === 'syncing' ? t('sync.syncing') : t('sync.waiting', { time })}</p>
          <p className="pairing__hint">{t('sync.firewall')}</p>
        </>
      )}
      {phase === 'done' && report && (
        <p className="notice" role="status">
          {t('backup.result', { ...report })}
        </p>
      )}
      {phase === 'expired' && <p role="status">{t('sync.expired')}</p>}
      {phase === 'error' && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {phase === 'done' ? (
          <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
            {t('backup.close')}
          </button>
        ) : (
          (phase === 'expired' || phase === 'error') && (
            <button type="button" className="btn btn--primary btn--block" onClick={again}>
              {t('sync.again')}
            </button>
          )
        )}
      </div>
    </div>
  )
}
