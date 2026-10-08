# Bloknot — notes for Claude

- The user speaks Uzbek: reply in Uzbek. UI text is Uzbek (Latin) and lives only in `src/i18n/uz.ts`; use `t()`, never hard-code strings in components.
- Plan and stage list: `docs/REJA.md`. Work stage by stage; update that file when a stage is finished or the plan changes.
- Stack: React + TypeScript + Vite, Capacitor (Android), later Electron (`desktop/`). No server: all data is local (IndexedDB).
- Layout: `src/core` (pure logic, must have Vitest tests), `src/platform` (Capacitor/Electron/browser differences behind one interface), `src/features/<name>`, `src/ui` (shared components, `theme.css` tokens).
- Every stored record has `id` (UUID), `createdAt`, `updatedAt`, `deletedAt` (soft delete) so export/import can merge by last write. Every DB schema change needs a new Dexie version + migration.
- No Android SDK in the container: APKs are built by `.github/workflows/build.yml`. Before pushing run `npm run lint && npm test && npm run build && npm run e2e`, and check UI with Playwright at 390×844 (light + dark).
- `e2e/` smoke tests run against the build in two projects; `new-webview` makes `scrollTo` return a Promise like recent Android WebView. Never write an expression-bodied effect (`useEffect(() => fn())`): whatever `fn` returns becomes the cleanup and crashed the app on Android 16. Use braces.
- The AdMob banner is a native view drawn over the WebView: anything that covers the screen (sheets, full-screen editors, the keyboard) must hold `pushAdBlocker()` while open. Ad IDs live in `src/platform/adConfig.ts` + `strings.xml` (`admob_app_id`); test IDs until the user sends real ones (`docs/ADMOB.md`).
- Bump `version` in `package.json` with each user-facing change; it is shown in Settings and in the crash screen.
- `android/app/bloknot-dev.keystore` is a deliberately public dev key so CI builds update each other; never use it for a Play release.
