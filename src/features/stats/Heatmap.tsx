import type { Weekday } from '../../core/models/types'
import { useState } from 'react'
import type { HeatmapCell } from '../../core/stats'
import { t } from '../../i18n'
import { formatDayShort, weekdayShort } from '../../i18n/format'

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]

/** Activity calendar: columns are weeks, rows Monday–Sunday, darker = more tasks done that day. */
export function Heatmap({ columns }: { columns: HeatmapCell[][] }) {
  const [selected, setSelected] = useState<HeatmapCell | null>(null)
  return (
    <div className="heatmap">
      <div className="heatmap__grid" style={{ gridTemplateColumns: `auto repeat(${columns.length}, 1fr)` }}>
        {WEEKDAYS.map(weekdayShort).map((name, row) => (
          <span key={name} className="heatmap__weekday" style={{ gridColumn: 1, gridRow: row + 1 }}>
            {row % 2 === 0 ? name : ''}
          </span>
        ))}
        {columns.map((column, col) =>
          column.map((cell, row) => (
            <button
              key={cell.date}
              type="button"
              className={`heatmap__cell level-${cell.level} ${cell.future ? 'is-future' : ''} ${selected?.date === cell.date ? 'is-selected' : ''}`}
              style={{ gridColumn: col + 2, gridRow: row + 1 }}
              disabled={cell.future}
              aria-label={t('stats.heatmapDetail', { day: formatDayShort(cell.date), count: cell.count })}
              onClick={() => setSelected(selected?.date === cell.date ? null : cell)}
            />
          )),
        )}
      </div>
      <div className="chart-footer">
        <span className="chart-legend">
          {t('stats.less')}
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`heatmap__cell heatmap__cell--legend level-${level}`} aria-hidden="true" />
          ))}
          {t('stats.more')}
        </span>
        <span className="chart-detail" aria-live="polite">
          {selected ? t('stats.heatmapDetail', { day: formatDayShort(selected.date), count: selected.count }) : ''}
        </span>
      </div>
    </div>
  )
}
