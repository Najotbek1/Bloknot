import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

type Handler = () => void

/** Open sheets register here; the Android back button closes the most recent one first. */
const handlers: Handler[] = []

export function pushBackHandler(handler: Handler): () => void {
  handlers.push(handler)
  return () => {
    const index = handlers.lastIndexOf(handler)
    if (index !== -1) handlers.splice(index, 1)
  }
}

/**
 * Wires the Android back button. `fallback` runs when nothing is open; it returns `false`
 * when there is nowhere to go back to, and then the app is closed.
 */
export function initBackButton(fallback: () => boolean): () => void {
  if (!Capacitor.isNativePlatform()) return () => {}
  const listener = App.addListener('backButton', () => {
    const handler = handlers.at(-1)
    if (handler) handler()
    else if (!fallback()) void App.exitApp()
  })
  return () => void listener.then((l) => l.remove())
}
