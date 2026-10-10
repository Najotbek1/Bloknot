# Maqsad (formerly Bloknot) — notes for Claude

- The app's visible name is **Maqsad**; internal names stay `bloknot` (IndexedDB name, `.bloknot` files, code). Never change `applicationId` `uz.najotbek.bloknot`: installed apps would lose their data.

- The user speaks Uzbek: reply in Uzbek. UI text is Uzbek (Latin) and lives only in `src/i18n/uz.ts`; use `t()`, never hard-code strings in components.
- Plan and stage list: `docs/REJA.md`. Work stage by stage; update that file when a stage is finished or the plan changes.
- Stack: React + TypeScript + Vite, Capacitor (Android), later Electron (`desktop/`). No server: all data is local (IndexedDB).
- Layout: `src/core` (pure logic, must have Vitest tests), `src/platform` (Capacitor/Electron/browser differences behind one interface), `src/features/<name>`, `src/ui` (shared components, `theme.css` tokens).
- Every stored record has `id` (UUID), `createdAt`, `updatedAt`, `deletedAt` (soft delete) so export/import can merge by last write. Every DB schema change needs a new Dexie version + migration.
- No Android SDK in the container: APKs are built by `.github/workflows/build.yml`. Before pushing run `npm run lint && npm test && npm run build && npm run e2e`, and check UI with Playwright at 390×844 (light + dark).
- `e2e/` smoke tests run against the build in two projects; `new-webview` makes `scrollTo` return a Promise like recent Android WebView. Never write an expression-bodied effect (`useEffect(() => fn())`): whatever `fn` returns becomes the cleanup and crashed the app on Android 16. Use braces.
- The AdMob banner is a native view drawn over the WebView: anything that covers the screen (sheets, full-screen editors, the keyboard) must hold `pushAdBlocker()` while open. Real ad IDs come only from the GitHub repository Variables `ADMOB_APP_ID` / `ADMOB_BANNER_ID` (CI → `VITE_ADMOB_*` for `src/platform/adConfig.ts`, `ADMOB_APP_ID` → Gradle `resValue admob_app_id`); without them Google's test IDs are used. The owner sets them alone (`docs/ADMOB.md`); never hard-code real IDs.
- Themes: every colour is a token in `src/ui/theme.css`; a new theme is one `:root[data-theme=x], [data-preview=x]` block defining every `--color-*` / `--chart-*` token, plus the `ThemePreference` value and its label. Components never hard-code colours.
- The owner's handbook (no-code tasks: APKs, AdMob, Play, versions) is `docs/QOLLANMA.md`; keep it in step with the build.
- Bump `version` in `package.json` with each user-facing change; it is shown in Settings and in the crash screen.
- `android/app/bloknot-dev.keystore` is a deliberately public dev key so CI builds update each other; never use it for a Play release. The Play upload key exists only in GitHub Secrets (`RELEASE_*`); `*.jks` is git-ignored — never commit one. Play materials are in `docs/play/`; icon source `docs/brand/maqsad-icon.svg` → `node scripts/render-brand.mjs`.
