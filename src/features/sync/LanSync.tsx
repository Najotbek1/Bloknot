import { useState } from 'react'
import { t } from '../../i18n'
import { desktop } from '../../platform/desktop'
import { phoneSyncSupported } from '../../platform/lanSync'
import { Sheet } from '../../ui/Sheet'
import { DesktopPairing } from './DesktopPairing'
import { PhoneSync } from './PhoneSync'
import './sync.css'

/** Settings → Wi-Fi sync: the computer shows a QR code, the phone scans it. Not in the browser. */
export function LanSync() {
  const [open, setOpen] = useState(false)
  if (!desktop && !phoneSyncSupported) return null
  return (
    <section className="section">
      <h2 className="section__title">{t('sync.title')}</h2>
      {desktop ? (
        <div className="lan-sync">
          <p className="field__hint">{t('sync.desktopIntro')}</p>
          <button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>
            {t('sync.open')}
          </button>
          <Sheet open={open} title={t('sync.open')} onClose={() => setOpen(false)} closeLabel={t('backup.close')}>
            <DesktopPairing api={desktop} onClose={() => setOpen(false)} />
          </Sheet>
        </div>
      ) : (
        <PhoneSync />
      )}
    </section>
  )
}
