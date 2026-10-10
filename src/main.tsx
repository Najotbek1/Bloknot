import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { db } from './core/db/schema'
import { getSettings } from './core/db/tasks'
import { setLanguage, t } from './i18n'
import { resolveLanguage } from './i18n/languages'
import './ui/theme.css'
import './ui/components.css'
import App from './app/App'
import { ErrorBoundary } from './app/ErrorBoundary'

const root = createRoot(document.getElementById('root')!)

// Before any text is shown: the phone's language, then the saved choice once the database is open.
setLanguage(resolveLanguage('auto', navigator.languages))

// Open the database before showing the app, so a storage failure is shown instead of silently losing data.
db.open()
  .then(async () => {
    setLanguage(resolveLanguage((await getSettings(db)).language, navigator.languages))
  })
  .then(
    () =>
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>,
      ),
    (err: unknown) =>
      root.render(
        <p className="card empty" role="alert" style={{ margin: 16 }}>
          {t('error.database', { error: err instanceof Error ? err.message : String(err) })}
        </p>,
      ),
  )
