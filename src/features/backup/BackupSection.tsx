import { useState } from 'react'
import { db } from '../../core/db/schema'
import { backupFileName, BackupError, createBackup, parseBackup, type Backup } from '../../core/sync/backup'
import { t } from '../../i18n'
import { formatUpdated } from '../../i18n/format'
import { pickTextFile, shareTextFile } from '../../platform/files'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toastContext'
import { ImportPreview } from './ImportSheet'
import { readLastExport, writeLastExport } from './lastExport'
import './backup.css'

/** Settings → Ma'lumotlar: export to a .bloknot file and merge one back in. */
export function BackupSection() {
  const [lastExport, setLastExport] = useState(readLastExport)
  const [picked, setPicked] = useState<{ name: string; backup: Backup } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function exportData() {
    setError(null)
    try {
      const now = Date.now()
      const name = backupFileName(new Date(now))
      const backup = await createBackup(db, __APP_VERSION__, now)
      await shareTextFile(name, JSON.stringify(backup), t('backup.shareTitle'))
      writeLastExport(now)
      setLastExport(now)
      toast.show(t('backup.exported', { name }))
    } catch (err) {
      setError(t('backup.exportFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  async function importData() {
    setError(null)
    try {
      const file = await pickTextFile()
      if (!file) return
      setPicked({ name: file.name, backup: parseBackup(file.text) })
    } catch (err) {
      setError(
        err instanceof BackupError
          ? t(`backup.error.${err.code}`)
          : t('backup.error.other', { error: err instanceof Error ? err.message : String(err) }),
      )
    }
  }

  return (
    <div className="backup">
      <p className="field__hint">{t('backup.intro')}</p>
      <div className="backup__buttons">
        <button type="button" className="btn btn--primary" onClick={() => void exportData()}>
          {t('backup.export')}
        </button>
        <button type="button" className="btn" onClick={() => void importData()}>
          {t('backup.import')}
        </button>
      </div>
      <p className="field__hint">
        {lastExport ? t('backup.lastExport', { when: formatUpdated(lastExport) }) : t('backup.neverExported')}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <Sheet
        open={picked !== null}
        title={t('backup.previewTitle')}
        onClose={() => setPicked(null)}
        closeLabel={t('backup.close')}
      >
        {picked && <ImportPreview fileName={picked.name} backup={picked.backup} onClose={() => setPicked(null)} />}
      </Sheet>
    </div>
  )
}
