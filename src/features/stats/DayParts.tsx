import { DAY_PARTS, type DayPart } from '../../core/stats'
import { t } from '../../i18n'

/** How many things were finished in the morning, afternoon, evening and night. */
export function DayParts({ counts }: { counts: Record<DayPart, number> }) {
  const max = Math.max(...DAY_PARTS.map((part) => counts[part]))
  if (max === 0) return null
  const best = DAY_PARTS.find((part) => counts[part] === max)!
  return (
    <div className="card">
      <ul className="kind-list">
        {DAY_PARTS.map((part) => (
          <li key={part} className="kind-row">
            <span className="kind-row__label">
              {t(`stats.dayPart.${part}`)}{' '}
              <span className="day-part__hours">{t(`stats.dayPartHours.${part}`)}</span>
            </span>
            <span className="kind-row__value">{counts[part]}</span>
            <span className="progress kind-row__meter" aria-hidden="true">
              <span className="progress__bar" style={{ width: `${(counts[part] / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="chart-detail day-part__best">{t('stats.dayPartBest', { part: t(`stats.dayPart.${best}`) })}</p>
    </div>
  )
}
