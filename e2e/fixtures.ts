import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

/**
 * `page` collects uncaught errors in `pageErrors`. In the "new-webview" project scroll methods return
 * a Promise, as in recent Chrome / Android WebView, where the app once went blank on tab switch.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    if (testInfo.project.metadata.promiseScroll) {
      await page.addInitScript(() => {
        for (const name of ['scrollTo', 'scroll', 'scrollBy'] as const) {
          const original = window[name].bind(window) as (...args: unknown[]) => void
          ;(window as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => {
            original(...args)
            return Promise.resolve()
          }
        }
      })
    }
    await use(errors)
  },
})
