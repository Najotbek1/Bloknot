import type { KindStat } from '../../core/stats'
import type { TaskKind } from '../../core/models/types'
import { t } from '../../i18n'

const KINDS: TaskKind[] = ['daily', 'weekly', 'monthly', 'range', 'general']

/** Done / total per task kind, as small meters. Kinds with nothing in the period are left out. */
export function KindBreakdown({ byKind }: { byKind: Record<TaskKind, KindStat> }) {
  const rows = KINDS.filter((kind) => byKind[kind].total > 0)
  if (rows.length === 0) return null
  return (
    <ul className="card kind-list">
      {rows.map((kind) => {
        const { done, total } = byKind[kind]
        return (
          <li key={kind} className="kind-row">
            <span className="kind-row__label">{t(`kind.${kind}`)}</span>
            <span className="kind-row__value">{t('stats.kindValue', { done, total })}</span>
            <span className="progress kind-row__meter" aria-hidden="true">
              <span className="progress__bar" style={{ width: `${(done / total) * 100}%` }} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
