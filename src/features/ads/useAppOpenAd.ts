import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useEffect } from 'react'
import { shouldShowAppOpen, type AppOpenTrigger } from '../../core/ads/appOpenPolicy'
import { adConfig } from '../../platform/adConfig'
import { getRingingAlarm, onAlarmRinging } from '../../platform/alarm'
import { adsSupported, preloadAppOpen, showAppOpenIfLoaded } from '../../platform/ads'
import { isAdBlocked } from './blockers'

/** This phone's App Open history. Device-local on purpose: it is not part of export/import. */
interface Stored {
  installedAt: number
  lastShownAt: number | null
  backgroundSince: number | null
}

const KEY = 'maqsad.appOpen'
/** Give notification taps and a ringing alarm time to be reported before deciding. */
const DECIDE_AFTER_MS = 1500
/** On a fresh start the ad may still be loading; never show it later than this. */
const COLD_WAIT_MS = 4000

function load(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Stored> | null
    if (parsed && typeof parsed.installedAt === 'number') {
      return { installedAt: parsed.installedAt, lastShownAt: parsed.lastShownAt ?? null, backgroundSince: parsed.backgroundSince ?? null }
    }
  } catch {
    // Unreadable storage: start over below.
  }
  return { installedAt: Date.now(), lastShownAt: null, backgroundSince: null }
}

function save(stored: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Without storage the limits reset on each start; harmless.
  }
}

/**
 * The full-screen ad shown when the app is opened, within the limits of appOpenPolicy.ts. It is
 * skipped when the app was opened from a notification or by the alarm, while a sheet is open, and
 * once the user has started doing something.
 */
export function useAppOpenAd() {
  useEffect(() => {
    if (!adsSupported) return
    let stored = load()
    save(stored)

    let interruptedAt = 0
    const markInterrupted = () => {
      interruptedAt = Date.now()
    }
    const notificationTap = LocalNotifications.addListener('localNotificationActionPerformed', markInterrupted)
    const stopAlarm = onAlarmRinging(markInterrupted)
    let touchedAt = 0
    const onTouch = () => {
      touchedAt = Date.now()
    }
    document.addEventListener('pointerdown', onTouch, true)

    let timer: number | undefined
    const decide = (trigger: AppOpenTrigger) => {
      const startedAt = Date.now()
      const backgroundSince = stored.backgroundSince
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const allowed = shouldShowAppOpen({
          now: Date.now(),
          installedAt: stored.installedAt,
          lastShownAt: stored.lastShownAt,
          trigger,
          backgroundSince,
          testMode: adConfig.appOpenTest,
        })
        if (!allowed || interruptedAt >= startedAt - DECIDE_AFTER_MS) return
        if (trigger === 'cold') {
          await Promise.race([preloadAppOpen(), new Promise((resolve) => window.setTimeout(resolve, COLD_WAIT_MS))])
        }
        // Do not cover what the user is doing: an open sheet, a ringing alarm, or a tap meanwhile.
        if (isAdBlocked() || touchedAt >= startedAt || interruptedAt >= startedAt - DECIDE_AFTER_MS) return
        if (await getRingingAlarm()) return
        if (await showAppOpenIfLoaded()) {
          stored = { ...stored, lastShownAt: Date.now() }
          save(stored)
        }
      }, DECIDE_AFTER_MS)
    }

    void preloadAppOpen()
    decide('cold')
    const stateChange = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        stored = { ...stored, backgroundSince: Date.now() }
        save(stored)
        return
      }
      decide('resume')
      void preloadAppOpen()
    })

    return () => {
      window.clearTimeout(timer)
      void notificationTap.then((handle) => handle.remove())
      void stateChange.then((handle) => handle.remove())
      stopAlarm()
      document.removeEventListener('pointerdown', onTouch, true)
    }
  }, [])
}
