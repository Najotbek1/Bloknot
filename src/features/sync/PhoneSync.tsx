import { useState } from 'react'
import { db } from '../../core/db/schema'
import { BackupError } from '../../core/sync/backup'
import { applySyncResponse, buildSyncRequest, LanSyncError, parsePairing, refusalCode } from '../../core/sync/lan'
import type { MergeReport } from '../../core/sync/merge'
import { t } from '../../i18n'
import { postToComputer, scanQr, UnreachableError } from '../../platform/lanSync'

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; text: string }
  | { kind: 'done'; report: MergeReport }
  | { kind: 'error'; message: string }

/** The phone's side: scan the computer's QR code, send the sealed backup, merge the answer. */
export function PhoneSync() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function sync() {
    try {
      const outcome = await scanQr()
      if ('cancelled' in outcome) return
      if ('scannerMissing' in outcome) {
        setStatus({ kind: 'error', message: t('sync.error.noScanner') })
        return
      }
      const pairing = parsePairing(outcome.text)
      if (!pairing) {
        setStatus({ kind: 'error', message: t('sync.error.badCode') })
        return
      }
      setStatus({ kind: 'busy', text: t('sync.connecting') })
      const request = await buildSyncRequest(db, pairing.key, __APP_VERSION__)
      const response = await postToComputer(pairing.hosts, pairing.port, request)
      if (response.status !== 200) {
        const code = refusalCode(response.body)
        setStatus({ kind: 'error', message: code === 'newerVersion' ? t('sync.error.newerVersion') : t('sync.error.rejected') })
        return
      }
      setStatus({ kind: 'busy', text: t('sync.syncing') })
      const report = await applySyncResponse(db, pairing.key, response.body)
      setStatus({ kind: 'done', report })
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) })
    }
  }

  return (
    <div className="lan-sync">
      <p className="field__hint">{t('sync.phoneIntro')}</p>
      <button type="button" className="btn btn--primary" disabled={status.kind === 'busy'} onClick={() => void sync()}>
        {t('sync.scan')}
      </button>
      {status.kind === 'busy' && <p role="status">{status.text}</p>}
      {status.kind === 'done' && (
        <p className="notice" role="status">
          {t('backup.result', { ...status.report })}
        </p>
      )}
      {status.kind === 'error' && (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      )}
    </div>
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof UnreachableError) return t('sync.error.unreachable')
  if (error instanceof BackupError && error.code === 'newerVersion') return t('sync.error.newerVersion')
  if (error instanceof LanSyncError) return t('sync.error.rejected')
  return t('sync.error.other', { error: error instanceof Error ? error.message : String(error) })
}
