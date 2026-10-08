import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { db } from './core/db/schema'
import { t } from './i18n'
import './ui/theme.css'
import './ui/components.css'
import App from './app/App'

const root = createRoot(document.getElementById('root')!)

// Open the database before showing the app, so a storage failure is shown instead of silently losing data.
db.open().then(
  () =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  (err: unknown) =>
    root.render(
      <p className="card empty" role="alert" style={{ margin: 16 }}>
        {t('error.database', { error: err instanceof Error ? err.message : String(err) })}
      </p>,
    ),
)
