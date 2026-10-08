import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against the production build (`npm run build` first).
 * The "new-webview" project emulates recent Chrome/Android WebView, where `window.scrollTo()`
 * returns a Promise; the app once went blank there when switching tabs.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Pixel 7'],
  },
  projects: [
    { name: 'browser' },
    { name: 'new-webview', metadata: { promiseScroll: true } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
