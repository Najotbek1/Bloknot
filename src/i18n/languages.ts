import type { Language, LanguagePreference } from '../core/models/types'

export interface LanguageInfo {
  code: Language
  /** The language's own name, shown the same in every UI language. */
  name: string
  /** BCP 47 locale for Intl (dates, plurals). */
  locale: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'uz', name: 'O‘zbekcha', locale: 'uz-Latn', dir: 'ltr' },
  { code: 'en', name: 'English', locale: 'en', dir: 'ltr' },
  { code: 'ru', name: 'Русский', locale: 'ru', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', locale: 'de', dir: 'ltr' },
  { code: 'ja', name: '日本語', locale: 'ja', dir: 'ltr' },
  { code: 'ko', name: '한국어', locale: 'ko', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi', dir: 'ltr' },
  { code: 'ar', name: 'العربية', locale: 'ar', dir: 'rtl' },
]

export function languageInfo(code: Language): LanguageInfo {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0]
}

/** The language to show: the chosen one, or for 'auto' the first of the phone's languages we have. */
export function resolveLanguage(preference: LanguagePreference | undefined, phone: readonly string[]): Language {
  if (preference && preference !== 'auto' && LANGUAGES.some((language) => language.code === preference)) {
    return preference
  }
  for (const tag of phone) {
    const base = tag.toLowerCase().split(/[-_]/)[0]
    const match = LANGUAGES.find((language) => language.code === base)
    if (match) return match.code
  }
  return 'uz'
}
