import type { AlarmTextLength } from '../models/types'
import { t, type MessageKey } from '../../i18n'

const COUNT = 8

/** The texts of one length, in the current language. */
export function challengeTexts(length: AlarmTextLength): string[] {
  return Array.from({ length: COUNT }, (_, index) => t(`alarm.text.${length}.${index + 1}` as MessageKey))
}

/** The text to type for one ringing; the same `seed` (the ring's start time) always gives the same text. */
export function pickChallenge(length: AlarmTextLength, seed: number): string {
  const texts = challengeTexts(length)
  return texts[Math.abs(Math.floor(seed)) % texts.length]
}

/**
 * What counts when comparing typed text: letters and digits in lower case, single spaces.
 * Punctuation and apostrophes are ignored, so "o‘" typed as "o'", "o`" or plain "o" all match.
 */
export function normalizeTyped(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesChallenge(input: string, target: string): boolean {
  const expected = normalizeTyped(target)
  return expected.length > 0 && normalizeTyped(input) === expected
}

/** How many characters of `target` (as shown) are already typed correctly, for highlighting. */
export function correctPrefixLength(input: string, target: string): number {
  const typed = normalizeTyped(input)
  let correct = 0
  for (let end = 1; end <= target.length; end++) {
    if (!typed.startsWith(normalizeTyped(target.slice(0, end)))) break
    correct = end
  }
  return correct
}
