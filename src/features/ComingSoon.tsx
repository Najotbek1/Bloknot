import { t, type MessageKey } from '../i18n'

export function ComingSoon({ title, message }: { title: MessageKey; message: MessageKey }) {
  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t(title)}</h1>
      </header>
      <p className="card empty">{t(message)}</p>
    </main>
  )
}
