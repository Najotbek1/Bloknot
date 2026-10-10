import type { MessageKey } from '../../i18n'
import { t } from '../../i18n'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function gradeOf(score: number): MessageKey {
  if (score >= 85) return 'stats.grade.great'
  if (score >= 65) return 'stats.grade.good'
  if (score >= 40) return 'stats.grade.growing'
  return 'stats.grade.start'
}

/** The responsibility score as a hero number inside a ring meter. */
export function ScoreRing({ score }: { score: number | null }) {
  const value = score ?? 0
  return (
    <section className="card score">
      <div className="score__ring">
        <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden="true">
          <circle cx="60" cy="60" r={RADIUS} className="score__track" />
          {score !== null && score > 0 && (
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              className="score__arc"
              strokeDasharray={`${(value / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              transform="rotate(-90 60 60)"
            />
          )}
        </svg>
        <span className="score__value" aria-label={`${t('stats.score')}: ${score ?? '—'}`}>
          {score ?? '—'}
        </span>
      </div>
      <div className="score__text">
        <h2 className="score__title">{t('stats.score')}</h2>
        <p className="score__grade">{score === null ? t('stats.scoreNone') : t(gradeOf(score))}</p>
        <details className="score__how">
          <summary>{t('stats.howScore')}</summary>
          <p>{t('stats.howScoreText')}</p>
        </details>
      </div>
    </section>
  )
}
