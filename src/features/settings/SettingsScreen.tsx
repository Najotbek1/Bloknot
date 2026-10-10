import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { getSettings, updateSettings } from '../../core/db/tasks'
import type { PlanView, ThemePreference } from '../../core/models/types'
import { t } from '../../i18n'
import { BackupSection } from '../backup/BackupSection'
import { NotificationSettings } from '../notifications/NotificationSettings'
import { AdSettings } from '../ads/AdSettings'
import './settings.css'

const THEMES: ThemePreference[] = ['system', 'light', 'dark', 'black', 'pink', 'amber']
const PLAN_VIEWS: PlanView[] = ['calendar', 'list']

export function SettingsScreen() {
  const settings = useLiveQuery(() => getSettings(db), [])

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('settings.title')}</h1>
      </header>

      <section className="section">
        <h2 className="section__title">{t('settings.theme')}</h2>
        <div className="theme-picker" role="radiogroup" aria-label={t('settings.theme')}>
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              role="radio"
              className="theme-option"
              aria-checked={settings?.theme === theme}
              onClick={() => void updateSettings(db, { theme })}
            >
              {/* The preview carries the theme's own tokens, so it shows its real colours. */}
              <span className="theme-option__preview" data-preview={theme} aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="theme-option__name">{t(`settings.theme.${theme}`)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">{t('settings.planView')}</h2>
        <div className="segmented" role="group" aria-label={t('settings.planView')}>
          {PLAN_VIEWS.map((planView) => (
            <button
              key={planView}
              type="button"
              className="segmented__item"
              aria-pressed={settings?.planView === planView}
              onClick={() => void updateSettings(db, { planView })}
            >
              {t(`settings.planView.${planView}`)}
            </button>
          ))}
        </div>
        <p className="field__hint settings-hint">{t('settings.planView.hint')}</p>
      </section>

      <section className="section">
        <h2 className="section__title">{t('settings.notifications')}</h2>
        {settings && (
          <NotificationSettings settings={settings} onChange={(changes) => void updateSettings(db, changes)} />
        )}
      </section>

      <section className="section">
        <h2 className="section__title">{t('backup.title')}</h2>
        <BackupSection />
      </section>

      <AdSettings />

      <section className="section">
        <h2 className="section__title">{t('settings.about')}</h2>
        <p className="card empty">
          {t('app.name')} · {t('app.version', { version: __APP_VERSION__ })}
        </p>
      </section>
    </main>
  )
}
