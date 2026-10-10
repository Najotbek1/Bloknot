import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { getSettings, updateSettings } from '../../core/db/tasks'
import type { LanguagePreference, PlanView, ThemePreference } from '../../core/models/types'
import { LANGUAGES } from '../../i18n/languages'
import { t } from '../../i18n'
import { BackupSection } from '../backup/BackupSection'
import { NotificationSettings } from '../notifications/NotificationSettings'
import { AdSettings } from '../ads/AdSettings'
import { Switch } from '../../ui/Switch'
import './settings.css'

/** Where users reach the developer, and the published privacy policy (public/privacy.html). */
const CONTACT_EMAIL = 'contact.najotbek@gmail.com'
const PRIVACY_URL = 'https://najotbek1.github.io/Bloknot/privacy.html'

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
        <h2 className="section__title">{t('settings.language')}</h2>
        <select
          className="input"
          aria-label={t('settings.language')}
          value={settings?.language ?? 'auto'}
          onChange={(event) => void updateSettings(db, { language: event.target.value as LanguagePreference })}
        >
          <option value="auto">{t('settings.language.auto')}</option>
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code} lang={language.locale}>
              {language.name}
            </option>
          ))}
        </select>
      </section>

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
        <h2 className="section__title">{t('settings.coach')}</h2>
        <div className="card settings-list">
          <Switch
            label={t('settings.coach.toggle')}
            hint={t('settings.coach.toggleHint')}
            checked={settings?.coachMode ?? true}
            onChange={(coachMode) => void updateSettings(db, { coachMode })}
          />
          <div className="coach-info">
            <p>{t('settings.coach.intro')}</p>
            <ul>
              <li className="coach-info__strict">{t('settings.coach.strict')}</li>
              <li>{t('settings.coach.normal')}</li>
              <li className="coach-info__inspiring">{t('settings.coach.inspiring')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">{t('backup.title')}</h2>
        <BackupSection />
      </section>

      <AdSettings />

      <section className="section">
        <h2 className="section__title">{t('settings.about')}</h2>
        <div className="card settings-list about-links">
          <a className="about-link about-link--stacked" href={`mailto:${CONTACT_EMAIL}`}>
            <span>{t('settings.contact')}</span>
            <span className="about-link__value">{CONTACT_EMAIL}</span>
          </a>
          <a className="about-link" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
            <span>{t('settings.privacy')}</span>
            <span className="about-link__value" aria-hidden="true">
              ↗
            </span>
          </a>
          <p className="about-version">
            {t('app.name')} · {t('app.version', { version: __APP_VERSION__ })}
          </p>
        </div>
      </section>
    </main>
  )
}
