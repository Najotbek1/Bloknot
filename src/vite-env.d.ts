/** App version from package.json, injected at build time. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Real AdMob ids from the GitHub Variables; unset in development and test builds. */
  readonly VITE_ADMOB_APP_ID?: string
  readonly VITE_ADMOB_BANNER_ID?: string
}
