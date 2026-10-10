import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths so the same build works on GitHub Pages (/Bloknot/) and inside the Capacitor APK.
  base: './',
  // All eight languages are bundled (the app works offline); the bundle is loaded from disk, not the network.
  build: {
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
