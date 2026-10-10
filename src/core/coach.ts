import { parseDateKey } from './dates'
import type { DateKey } from './models/types'
import { t, type MessageKey } from '../i18n'

/**
 * The "coach": notification wording follows the user's 7-day responsibility score.
 * Below 50 it is strict (firm, never insulting), above 70 it cheers, in between (or with too
 * little data to judge) it stays neutral.
 */
export type CoachTone = 'strict' | 'normal' | 'inspiring'

export const COACH_STRICT_BELOW = 50
export const COACH_INSPIRING_ABOVE = 70

export function coachTone(score: number | null): CoachTone {
  if (score === null) return 'normal'
  if (score < COACH_STRICT_BELOW) return 'strict'
  if (score > COACH_INSPIRING_ABOVE) return 'inspiring'
  return 'normal'
}

const PHRASES: Record<Exclude<CoachTone, 'normal'>, MessageKey[]> = {
  strict: [
    'coach.strict.1',
    'coach.strict.2',
    'coach.strict.3',
    'coach.strict.4',
    'coach.strict.5',
    'coach.strict.6',
    'coach.strict.7',
    'coach.strict.8',
  ],
  inspiring: [
    'coach.inspiring.1',
    'coach.inspiring.2',
    'coach.inspiring.3',
    'coach.inspiring.4',
    'coach.inspiring.5',
    'coach.inspiring.6',
    'coach.inspiring.7',
    'coach.inspiring.8',
  ],
}

/**
 * A phrase for `tone` on `date`, or `null` for the neutral tone. The day and `slot` (which
 * notification of the day) pick it, so notifications vary but stay the same when re-planned.
 */
export function coachPhrase(tone: CoachTone, date: DateKey, slot = 0): string | null {
  if (tone === 'normal') return null
  const list = PHRASES[tone]
  const day = Math.floor(parseDateKey(date).getTime() / 86_400_000)
  return t(list[(((day + slot) % list.length) + list.length) % list.length])
}
