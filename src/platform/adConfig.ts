/**
 * AdMob ids. They come from the GitHub repository Variables ADMOB_APP_ID and ADMOB_BANNER_ID,
 * which the build passes in as VITE_ADMOB_APP_ID / VITE_ADMOB_BANNER_ID (and ADMOB_APP_ID to
 * Gradle for the manifest). The owner sets them in GitHub without touching code: docs/ADMOB.md.
 *
 * Without them the app uses Google's official TEST ids: they always show a "Test Ad" banner and
 * earn nothing, which is required while developing (clicking your own real ads gets the account
 * banned).
 */
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713'
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/9214589741'

const appId = import.meta.env.VITE_ADMOB_APP_ID?.trim()
const bannerId = import.meta.env.VITE_ADMOB_BANNER_ID?.trim()
const real = Boolean(appId && bannerId)

export const adConfig = {
  /** App ID, `ca-app-pub-…~…`. Gradle writes the same value into the manifest. */
  appId: real ? appId! : TEST_APP_ID,
  /** Adaptive banner ad unit, `ca-app-pub-…/…`. */
  bannerId: real ? bannerId! : TEST_BANNER_ID,
  useTestAds: !real,
} as const
