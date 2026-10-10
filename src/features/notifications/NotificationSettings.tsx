import type { Settings } from '../../core/models/types'
import { t } from '../../i18n'
import { openExactAlarmSettings, sendTestNotification } from '../../platform/notifications'
import { Switch } from '../../ui/Switch'
import { useToast } from '../../ui/toastContext'
import { useNotificationPermission } from './usePermission'

interface NotificationSettingsProps {
  settings: Settings
  onChange: (changes: Partial<Settings>) => void
}

export function NotificationSettings({ settings, onChange }: NotificationSettingsProps) {
  const { permission, exactAlarm, request } = useNotificationPermission()
  const toast = useToast()

  return (
    <>
      {permission === 'unsupported' && (
        <div className="notice">
          <p>{t('settings.notify.unsupported')}</p>
        </div>
      )}
      {permission === 'prompt' && (
        <div className="notice">
          <p>{t('settings.notify.prompt')}</p>
          <button type="button" className="btn btn--primary" onClick={() => void request()}>
            {t('settings.notify.allow')}
          </button>
        </div>
      )}
      {permission === 'denied' && (
        <div className="notice notice--warning">
          <p>{t('settings.notify.denied')}</p>
        </div>
      )}
      {permission === 'granted' && exactAlarm === 'denied' && (
        <div className="notice notice--warning">
          <p>{t('settings.notify.exact')}</p>
          <button type="button" className="btn" onClick={() => void openExactAlarmSettings()}>
            {t('settings.notify.openSettings')}
          </button>
        </div>
      )}

      <div className="card settings-list">
        <div>
          <Switch
            label={t('settings.notify.morning')}
            hint={t('settings.notify.morningHint')}
            checked={settings.morningSummary}
            onChange={(morningSummary) => onChange({ morningSummary })}
          />
          {settings.morningSummary && (
            <div className="settings-time">
              <input
                className="input"
                type="time"
                aria-label={t('settings.notify.morning')}
                value={settings.morningSummaryTime}
                onChange={(event) => event.target.value && onChange({ morningSummaryTime: event.target.value })}
              />
            </div>
          )}
        </div>
        <div>
          <Switch
            label={t('settings.notify.evening')}
            hint={t('settings.notify.eveningHint')}
            checked={settings.eveningSummary}
            onChange={(eveningSummary) => onChange({ eveningSummary })}
          />
          {settings.eveningSummary && (
            <div className="settings-time">
              <input
                className="input"
                type="time"
                aria-label={t('settings.notify.evening')}
                value={settings.eveningSummaryTime}
                onChange={(event) => event.target.value && onChange({ eveningSummaryTime: event.target.value })}
              />
            </div>
          )}
        </div>
        <Switch
          label={t('settings.notify.deadline')}
          hint={t('settings.notify.deadlineHint')}
          checked={settings.deadlineWarnings}
          onChange={(deadlineWarnings) => onChange({ deadlineWarnings })}
        />
      </div>

      {permission === 'granted' && (
        <button
          type="button"
          className="btn btn--block section"
          onClick={() => {
            void sendTestNotification()
            toast.show(t('settings.notify.testSent'))
          }}
        >
          {t('settings.notify.test')}
        </button>
      )}
    </>
  )
}
