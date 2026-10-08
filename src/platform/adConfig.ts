/**
 * AdMob ids. These are Google's official TEST ids: they always show a "Test Ad" banner and earn
 * nothing, which is required while developing (clicking your own real ads gets the account banned).
 *
 * To earn money, replace both ids with the ones from your AdMob account (see docs/ADMOB.md), set
 * `useTestAds` to false, and put the same App ID in android/app/src/main/res/values/strings.xml.
 */
export const adConfig = {
  /** App ID, `ca-app-pub-…~…`. Must match `admob_app_id` in strings.xml. */
  appId: 'ca-app-pub-3940256099942544~3347511713',
  /** Adaptive banner ad unit, `ca-app-pub-…/…`. */
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  useTestAds: true,
} as const
