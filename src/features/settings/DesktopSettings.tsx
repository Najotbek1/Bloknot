import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { desktop } from '../../platform/desktop'
import { Switch } from '../../ui/Switch'

/** Settings → Kompyuter: only in the computer app (Windows, macOS, Linux). Start with Windows, and whether closing keeps it in the tray. */
export function DesktopSettings() {
  const [autoStart, setAutoStart] = useState<boolean | null>(null)
  const [closeToTray, setCloseToTray] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void desktop?.getAutoStart().then((enabled) => {
      if (active) setAutoStart(enabled)
    })
    void desktop?.getCloseToTray().then((enabled) => {
      if (active) setCloseToTray(enabled)
    })
    return () => {
      active = false
    }
  }, [])

  if (!desktop) return null
  const mac = desktop.platform === 'darwin'
  const linux = desktop.platform === 'linux'
  return (
    <section className="section">
      <h2 className="section__title">{t('settings.desktop')}</h2>
      <div className="card settings-list">
        <Switch
          label={t(
            mac
              ? 'settings.desktop.autostartMac'
              : linux
                ? 'settings.desktop.autostartLinux'
                : 'settings.desktop.autostart',
          )}
          hint={t('settings.desktop.autostartHint')}
          checked={autoStart ?? false}
          onChange={(enabled) => {
            setAutoStart(enabled)
            void desktop?.setAutoStart(enabled)
          }}
        />
        <Switch
          label={t('settings.desktop.closeToTray')}
          hint={t('settings.desktop.closeToTrayHint')}
          checked={closeToTray ?? true}
          onChange={(enabled) => {
            setCloseToTray(enabled)
            void desktop?.setCloseToTray(enabled)
          }}
        />
        <p className="coach-info">
          {closeToTray === false
            ? t('settings.desktop.trayOffNote')
            : t(
                mac
                  ? 'settings.desktop.trayNoteMac'
                  : linux
                    ? 'settings.desktop.trayNoteLinux'
                    : 'settings.desktop.trayNote',
              )}
        </p>
      </div>
    </section>
  )
}
