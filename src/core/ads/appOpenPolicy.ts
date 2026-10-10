import { toDateKey } from '../dates'

/**
 * When the full-screen "App Open" ad may show: never in the first days after install, at most
 * MAX_PER_DAY times a day with at least MIN_GAP_MS between two, and only on a fresh start or after
 * the app was away for a while. (Alarms, notification taps and open sheets are checked by the
 * caller.) In test mode — no real ad id yet — it shows often enough to try out.
 */
export const MIN_INSTALL_DAYS = 3
export const MAX_PER_DAY = 5
export const MIN_GAP_MS = 60 * 60 * 1000
export const RESUME_AFTER_MS = 30 * 60 * 1000
export const TEST_MIN_INTERVAL_MS = 2 * 60 * 1000

export type AppOpenTrigger = 'cold' | 'resume'

export interface AppOpenState {
  now: number
  /** First time the app ran on this phone. */
  installedAt: number
  /** Times it was shown, newest last (only the recent ones matter). */
  shownAt: number[]
  trigger: AppOpenTrigger
  /** When the app went to the background, for a resume. */
  backgroundSince: number | null
  testMode: boolean
}

export function shouldShowAppOpen(state: AppOpenState): boolean {
  const { now, installedAt, shownAt, trigger, backgroundSince, testMode } = state
  const last = shownAt.length > 0 ? Math.max(...shownAt) : null

  if (trigger === 'resume') {
    const away = backgroundSince === null ? 0 : now - backgroundSince
    if (away < (testMode ? TEST_MIN_INTERVAL_MS : RESUME_AFTER_MS)) return false
  }

  if (testMode) return last === null || now - last >= TEST_MIN_INTERVAL_MS

  if (now - installedAt < MIN_INSTALL_DAYS * 24 * 60 * 60 * 1000) return false
  if (last !== null && now - last < MIN_GAP_MS) return false
  const today = toDateKey(new Date(now))
  return shownAt.filter((time) => toDateKey(new Date(time)) === today).length < MAX_PER_DAY
}

/** The show times worth keeping: today's (for the daily limit), newest last. */
export function recordShown(shownAt: number[], now: number): number[] {
  const today = toDateKey(new Date(now))
  return [...shownAt.filter((time) => toDateKey(new Date(time)) === today), now]
}
