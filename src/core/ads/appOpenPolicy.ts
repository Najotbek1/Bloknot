import { toDateKey } from '../dates'

/**
 * When the full-screen "App Open" ad may show. It must stay rare in a planner people open many
 * times a day, so: never in the first days after install, at most once a day, and only on a fresh
 * start or after the app was away for a while. (Alarms, notification taps and open sheets are
 * checked by the caller.) In test mode — no real ad id yet — it shows often enough to try out.
 */
export const MIN_INSTALL_DAYS = 3
export const RESUME_AFTER_MS = 30 * 60 * 1000
export const TEST_MIN_INTERVAL_MS = 2 * 60 * 1000

export type AppOpenTrigger = 'cold' | 'resume'

export interface AppOpenState {
  now: number
  /** First time the app ran on this phone. */
  installedAt: number
  lastShownAt: number | null
  trigger: AppOpenTrigger
  /** When the app went to the background, for a resume. */
  backgroundSince: number | null
  testMode: boolean
}

export function shouldShowAppOpen(state: AppOpenState): boolean {
  const { now, installedAt, lastShownAt, trigger, backgroundSince, testMode } = state

  if (trigger === 'resume') {
    const away = backgroundSince === null ? 0 : now - backgroundSince
    if (away < (testMode ? TEST_MIN_INTERVAL_MS : RESUME_AFTER_MS)) return false
  }

  if (testMode) return lastShownAt === null || now - lastShownAt >= TEST_MIN_INTERVAL_MS

  if (now - installedAt < MIN_INSTALL_DAYS * 24 * 60 * 60 * 1000) return false
  return lastShownAt === null || toDateKey(new Date(lastShownAt)) !== toDateKey(new Date(now))
}
