import { useState } from 'react'
import { db } from '../../core/db/schema'
import { backupSummary, type Backup } from '../../core/sync/backup'
import { importBackup } from '../../core/sync/importBackup'
import type { MergeReport } from '../../core/sync/merge'
import { t } from '../../i18n'
import { formatUpdated } from '../../i18n/format'

interface ImportPreviewProps {
  fileName: string
  backup: Backup
  onClose: () => void
}

/** Shows what a file contains, merges it on request and reports what changed. */
export function ImportPreview({ fileName, backup, onClose }: ImportPreviewProps) {
  const [report, setReport] = useState<MergeReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const summary = backupSummary(backup)

  async function merge() {
    setBusy(true)
    try {
      setReport(await importBackup(db, backup))
    } catch (err) {
      setError(t('backup.error.other', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="import-preview">
      <div className="card import-preview__facts">
        <p>{t('backup.fileName', { name: fileName })}</p>
        <p className="import-preview__main">{t('backup.fileContains', { ...summary })}</p>
        {backup.exportedAt > 0 && <p>{t('backup.exportedAt', { when: formatUpdated(backup.exportedAt) })}</p>}
      </div>

      {report ? (
        <p className="notice" role="status">
          {t('backup.result', { ...report })}
        </p>
      ) : (
        <p className="field__hint">{t('backup.mergeHint')}</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        {report ? (
          <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
            {t('backup.close')}
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => void merge()}>
            {t('backup.merge')}
          </button>
        )}
      </div>
    </div>
  )
}
