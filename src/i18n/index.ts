import type { Language } from '../core/models/types'
import { ar } from './ar'
import { de } from './de'
import { en } from './en'
import { hi } from './hi'
import { ja } from './ja'
import { ko } from './ko'
import { languageInfo } from './languages'
import type { Messages } from './messages'
import { formatMessage } from './plural'
import { ru } from './ru'
import { uz, type MessageKey } from './uz'

export type { MessageKey }

/** Every language's texts. Uzbek is the source; the others mirror its keys (src/i18n/<code>.ts). */
const ALL: Record<Language, Messages> = { uz, en, ru, de, ja, ko, hi, ar }

let current: Language = 'uz'
let messages: Messages = uz

/** Switches the UI language and the page's `lang` / `dir` (Arabic is right-to-left). */
export function setLanguage(code: Language): void {
  current = code in ALL ? code : 'uz'
  messages = ALL[current]
  const info = languageInfo(current)
  document.documentElement.lang = info.locale
  document.documentElement.dir = info.dir
}

export function getLanguage(): Language {
  return current
}

/**
 * The text for `key` in the current language, with `{name}` placeholders and
 * `{count, plural, one {…} other {…}}` forms filled from `params`.
 */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return formatMessage(messages[key] ?? uz[key], params, languageInfo(current).locale)
}
