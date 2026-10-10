import { describe, expect, it } from 'vitest'
import { ar } from './ar'
import { de } from './de'
import { en } from './en'
import { hi } from './hi'
import { ja } from './ja'
import { ko } from './ko'
import { resolveLanguage } from './languages'
import { formatMessage } from './plural'
import { ru } from './ru'
import { uz } from './uz'

const TRANSLATIONS = { en, ru, de, ja, ko, hi, ar }

/** Plain placeholder names used anywhere in a message, plural variables included. */
function placeholders(text: string): Set<string> {
  const names = new Set<string>()
  // A `{` right after a plural branch name (`one {day}`) opens that branch's text, not a placeholder.
  for (const match of text.matchAll(/(?<!(?:zero|one|two|few|many|other|=\d+)\s*)\{(\w+)/g)) names.add(match[1])
  return names
}

describe('translations', () => {
  for (const [code, messages] of Object.entries(TRANSLATIONS)) {
    it(`${code} has every key and keeps the placeholders`, () => {
      expect(Object.keys(messages).sort()).toEqual(Object.keys(uz).sort())
      for (const key of Object.keys(uz) as (keyof typeof uz)[]) {
        expect([...placeholders(messages[key])].sort(), `${code} ${key}`).toEqual([...placeholders(uz[key])].sort())
        // Every message renders without leftover syntax for a typical value.
        const params = Object.fromEntries([...placeholders(uz[key])].map((name) => [name, 3]))
        expect(formatMessage(messages[key], params, code), `${code} ${key}`).not.toMatch(/\{\w+\}|plural,/)
      }
    })
  }
})

describe('resolveLanguage', () => {
  it('uses the saved choice, else the first phone language we have, else Uzbek', () => {
    expect(resolveLanguage('ru', ['en-US'])).toBe('ru')
    expect(resolveLanguage('auto', ['fr-FR', 'de-AT', 'en'])).toBe('de')
    expect(resolveLanguage('auto', ['fr-FR'])).toBe('uz')
    expect(resolveLanguage(undefined, ['ar-EG'])).toBe('ar')
  })
})
