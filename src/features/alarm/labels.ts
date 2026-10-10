import type { Weekday } from '../../core/models/types'
import { t } from '../../i18n'
import { uzWeekdaysShort } from '../../i18n/uz'

/** "Bir marta", "Har kuni", "Ish kunlari" or "Du, Ch, Ju". */
export function describeWeekdays(weekdays: Weekday[]): string {
  if (weekdays.length === 0) return t('alarm.once')
  if (weekdays.length === 7) return t('alarm.everyDay')
  if (weekdays.length === 5 && [1, 2, 3, 4, 5].every((day) => weekdays.includes(day as Weekday))) {
    return t('alarm.weekdaysOnly')
  }
  return weekdays.map((day) => uzWeekdaysShort[day - 1]).join(', ')
}
