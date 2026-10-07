# Bloknot — notes for Claude

- The user speaks Uzbek: reply in Uzbek. UI text is Uzbek (Latin) and lives only in `src/i18n/uz.ts`; use `t()`, never hard-code strings in components.
- Plan and stage list: `docs/REJA.md`. Work stage by stage; update that file when a stage is finished or the plan changes.
- Stack: React + TypeScript + Vite, Capacitor (Android), later Electron (`desktop/`). No server: all data is local (IndexedDB).
- Layout: `src/core` (pure logic, must have Vitest tests), `src/platform` (Capacitor/Electron/browser differences behind one interface), `src/features/<name>`, `src/ui` (shared components, `theme.css` tokens).
- Every stored record has `id` (UUID), `createdAt`, `updatedAt`, `deletedAt` (soft delete) so export/import can merge by last write. Every DB schema change needs a new Dexie version + migration.
- No Android SDK in the container: APKs are built by `.github/workflows/build.yml`. Before pushing run `npm run lint && npm test && npm run build`, and check UI with Playwright at 390×844 (light + dark).
- `android/app/bloknot-dev.keystore` is a deliberately public dev key so CI builds update each other; never use it for a Play release.
