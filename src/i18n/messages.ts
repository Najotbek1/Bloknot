import type { MessageKey } from './uz'

/** A language file: every key of uz.ts, translated. TypeScript reports a missing key at build time. */
export type Messages = Record<MessageKey, string>
