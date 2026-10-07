import { t } from './i18n'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <section className="welcome">
        <div className="welcome__logo" aria-hidden="true">
          B
        </div>
        <h1>{t('app.name')}</h1>
        <p>{t('app.tagline')}</p>
        <p>{t('home.comingSoon')}</p>
        <small>{t('app.version', { version: __APP_VERSION__ })}</small>
      </section>
    </main>
  )
}
