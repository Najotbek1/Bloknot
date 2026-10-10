import { Component, type ErrorInfo, type ReactNode } from 'react'
import { pushAdBlocker } from '../features/ads/blockers'
import { t } from '../i18n'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  /** Bumped by "back to Today" so the app remounts from a clean state. */
  attempt: number
}

/**
 * Shows the error (with app and WebView version, for a screenshot) instead of a blank screen
 * when something in the app throws while rendering.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  private releaseAd: (() => void) | null = null

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed', error, info.componentStack)
    this.releaseAd ??= pushAdBlocker()
  }

  componentDidUpdate() {
    if (!this.state.error && this.releaseAd) {
      this.releaseAd()
      this.releaseAd = null
    }
  }

  render() {
    const { error, attempt } = this.state
    if (!error) return <div key={attempt}>{this.props.children}</div>

    return (
      <main className="crash" role="alert">
        <h1 className="crash__title">{t('error.title')}</h1>
        <p>{t('error.hint')}</p>
        <pre className="crash__details">
          {error.message}
          {'\n\n'}
          {t('app.version', { version: __APP_VERSION__ })}
          {'\n'}
          {navigator.userAgent}
          {error.stack ? `\n\n${error.stack.split('\n').slice(0, 6).join('\n')}` : ''}
        </pre>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => this.setState({ error: null, attempt: attempt + 1 })}
        >
          {t('error.backToToday')}
        </button>
        <button type="button" className="btn btn--block" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </button>
      </main>
    )
  }
}
