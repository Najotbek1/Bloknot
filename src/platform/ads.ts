import { AdMob, AppOpenAdPluginEvents, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'
import { adConfig } from './adConfig'

/**
 * The bottom banner. Only the Android app shows ads; in the browser and the desktop app every
 * function here does nothing. Ad failures are logged and swallowed: they must never break the app.
 */
export const adsSupported = Capacitor.isNativePlatform()

/** Height of the bottom navigation, so the banner sits right above it (dp = CSS px in the WebView). */
const NAV_HEIGHT_DP = 64

/**
 * The system navigation bar's height. With edge-to-edge (Android 15+) the app draws under it, and
 * the bottom navigation is padded by this much, so the banner must be lifted by it too.
 */
function safeAreaBottom(): number {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)'
  document.body.append(probe)
  const inset = parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  return Math.round(inset)
}

let ready: Promise<boolean> | null = null
let privacyOptionsRequired = false
let shown = false

function warn(step: string, error: unknown) {
  console.warn(`Ads: ${step} failed`, error)
}

/** Initializes AdMob and asks for consent where the law requires it. Resolves to "can show ads". */
export function initAds(): Promise<boolean> {
  if (!adsSupported) return Promise.resolve(false)
  ready ??= (async () => {
    try {
      await AdMob.initialize({ initializeForTesting: adConfig.useTestAds })
      let consent = await AdMob.requestConsentInfo()
      if (!consent.canRequestAds && consent.isConsentFormAvailable) consent = await AdMob.showConsentForm()
      // The package does not export this enum; its value is the string 'REQUIRED'.
      privacyOptionsRequired = String(consent.privacyOptionsRequirementStatus) === 'REQUIRED'
      return consent.canRequestAds
    } catch (error) {
      warn('initialize', error)
      return false
    }
  })()
  return ready
}

/** Shows or hides the banner. The first show loads it; later ones just bring it back. */
export async function setBannerVisible(visible: boolean): Promise<void> {
  if (!(await initAds())) return
  try {
    if (!visible) {
      if (shown) await AdMob.hideBanner()
      return
    }
    if (shown) {
      await AdMob.resumeBanner()
      return
    }
    shown = true
    await AdMob.showBanner({
      adId: adConfig.bannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: NAV_HEIGHT_DP + safeAreaBottom(),
      isTesting: adConfig.useTestAds,
    })
  } catch (error) {
    warn(visible ? 'show' : 'hide', error)
  }
}

/** Reports the banner's height in CSS pixels (0 when no ad is loaded). */
export function onBannerHeight(listener: (height: number) => void): () => void {
  if (!adsSupported) return () => {}
  const handles = [
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => listener(size.height)),
    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => listener(0)),
  ]
  return () => {
    for (const handle of handles) void handle.then((h) => h.remove())
  }
}

/** Whether the privacy options form must be offered (e.g. users in the EU). */
export async function adPrivacyOptionsAvailable(): Promise<boolean> {
  return (await initAds()) && privacyOptionsRequired
}

export async function showAdPrivacyOptions(): Promise<void> {
  if (!adsSupported) return
  try {
    await AdMob.showPrivacyOptionsForm()
  } catch (error) {
    warn('privacy options', error)
  }
}

/** A loaded App Open ad is only good for about four hours. */
const APP_OPEN_MAX_AGE_MS = 4 * 60 * 60 * 1000
let appOpenLoadedAt = 0
let appOpenLoading: Promise<void> | null = null

/** What the App Open ad is doing, shown in Settings while testing so problems are visible. */
export type AppOpenStatus =
  | { state: 'idle' | 'loading' | 'ready' | 'shown' | 'skipped' }
  | { state: 'error'; message: string }
let appOpenStatus: AppOpenStatus = { state: 'idle' }
const statusListeners = new Set<(status: AppOpenStatus) => void>()

export function setAppOpenStatus(status: AppOpenStatus): void {
  appOpenStatus = status
  for (const listener of statusListeners) listener(status)
}

export function onAppOpenStatus(listener: (status: AppOpenStatus) => void): () => void {
  statusListeners.add(listener)
  listener(appOpenStatus)
  return () => {
    statusListeners.delete(listener)
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) return String(error.message)
  return String(error)
}

/** Whether a loaded, still fresh App Open ad is waiting. */
export function appOpenReady(): boolean {
  return appOpenLoadedAt > 0 && Date.now() - appOpenLoadedAt < APP_OPEN_MAX_AGE_MS
}

/** Loads the App Open ad in the background so it can show instantly later. */
export function preloadAppOpen(): Promise<void> {
  if (!adsSupported || appOpenReady()) return Promise.resolve()
  appOpenLoading ??= (async () => {
    try {
      if (!(await initAds())) {
        setAppOpenStatus({ state: 'error', message: 'consent / init' })
        return
      }
      setAppOpenStatus({ state: 'loading' })
      await AdMob.loadAppOpen({ adId: adConfig.appOpenId })
      appOpenLoadedAt = Date.now()
      setAppOpenStatus({ state: 'ready' })
    } catch (error) {
      warn('load app open', error)
      setAppOpenStatus({ state: 'error', message: errorMessage(error) })
    } finally {
      appOpenLoading = null
    }
  })()
  return appOpenLoading
}

/**
 * Shows the App Open ad if one is ready (never waits for one). Resolves `true` when it was shown,
 * after it is closed; the next one is then loaded.
 */
export async function showAppOpenIfLoaded(): Promise<boolean> {
  if (!adsSupported || !appOpenReady()) return false
  try {
    const closed = new Promise<void>((resolve) => {
      const handles = [
        AdMob.addListener(AppOpenAdPluginEvents.Closed, () => done()),
        AdMob.addListener(AppOpenAdPluginEvents.FailedToShow, () => done()),
      ]
      function done() {
        for (const handle of handles) void handle.then((h) => h.remove())
        resolve()
      }
    })
    appOpenLoadedAt = 0
    await AdMob.showAppOpen()
    setAppOpenStatus({ state: 'shown' })
    await closed
    void preloadAppOpen()
    return true
  } catch (error) {
    warn('show app open', error)
    setAppOpenStatus({ state: 'error', message: errorMessage(error) })
    void preloadAppOpen()
    return false
  }
}
