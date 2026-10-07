import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { getSettings, updateSettings } from '../../core/db/tasks'
import type { ThemePreference } from '../../core/models/types'
import { t } from '../../i18n'

const THEMES: ThemePreference[] = ['system', 'light', 'dark']

export function SettingsScreen() {
  const settings = useLiveQuery(() => getSettings(db), [])

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('settings.title')}</h1>
      </header>

      <section className="section">
        <h2 className="section__title">{t('settings.theme')}</h2>
        <div className="segmented" role="group" aria-label={t('settings.theme')}>
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              className="segmented__item"
              aria-pressed={settings?.theme === theme}
              onClick={() => void updateSettings(db, { theme })}
            >
              {t(`settings.theme.${theme}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">{t('settings.about')}</h2>
        <p className="card empty">
          {t('app.name')} · {t('app.version', { version: __APP_VERSION__ })}
        </p>
      </section>
    </main>
  )
}
