import { useState } from 'react'
import type { DayStat } from '../../core/stats'
import { weekdayOf, parseDateKey } from '../../core/dates'
import { t } from '../../i18n'
import { formatDayShort, weekdayShort } from '../../i18n/format'

const HEIGHT = 140
const LABEL_SPACE = 20
const TOP_SPACE = 14

/**
 * Per-day columns: the track shows how many tasks were due, the filled part how many were done.
 * One axis (count). Tapping a column shows its numbers underneath.
 */
export function DailyBars({ series }: { series: DayStat[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const max = Math.max(1, ...series.map((day) => day.planned))
  const width = 320
  const slot = width / series.length
  const barWidth = Math.min(28, Math.max(4, slot * 0.6))
  const plot = HEIGHT - LABEL_SPACE - TOP_SPACE
  const y = (value: number) => TOP_SPACE + plot - (value / max) * plot
  const showLabel = (index: number) => series.length <= 7 || index % 5 === 0 || index === series.length - 1
  const day = series.find((item) => item.date === selected)

  return (
    <div className="daily-bars">
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="daily-bars__svg" role="img" aria-label={t('stats.daily')}>
        <line x1="0" x2={width} y1={y(max)} y2={y(max)} className="chart-grid" />
        <text x="0" y={y(max) - 3} className="chart-axis-label">
          {max}
        </text>
        <line x1="0" x2={width} y1={y(0)} y2={y(0)} className="chart-baseline" />
        {series.map((item, index) => {
          const x = index * slot + (slot - barWidth) / 2
          const isSelected = item.date === selected
          return (
            <g key={item.date}>
              {item.planned > 0 && (
                <rect
                  x={x}
                  y={y(item.planned)}
                  width={barWidth}
                  height={y(0) - y(item.planned)}
                  rx={Math.min(4, barWidth / 2)}
                  className="daily-bars__track"
                />
              )}
              {item.done > 0 && (
                <rect
                  x={x}
                  y={y(item.done)}
                  width={barWidth}
                  height={y(0) - y(item.done)}
                  rx={Math.min(4, barWidth / 2)}
                  className={`daily-bars__done ${isSelected ? 'is-selected' : ''}`}
                />
              )}
              {showLabel(index) && (
                <text x={index * slot + slot / 2} y={HEIGHT - 4} textAnchor="middle" className="chart-axis-label">
                  {series.length <= 7
                    ? weekdayShort(weekdayOf(item.date))
                    : parseDateKey(item.date).getDate()}
                </text>
              )}
              {/* Hit target: the whole column, wider than the bar. */}
              <rect
                x={index * slot}
                y={0}
                width={slot}
                height={HEIGHT}
                className="chart-hit"
                role="button"
                tabIndex={0}
                aria-label={t('stats.dayDetail', {
                  day: formatDayShort(item.date),
                  done: item.done,
                  planned: item.planned,
                })}
                onClick={() => setSelected(isSelected ? null : item.date)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelected(isSelected ? null : item.date)
                }}
              />
            </g>
          )
        })}
      </svg>
      <div className="chart-footer">
        <span className="chart-legend">
          <span className="chart-legend__swatch chart-legend__swatch--track" /> {t('stats.planned')}
          <span className="chart-legend__swatch chart-legend__swatch--done" /> {t('stats.doneLegend')}
        </span>
        <span className="chart-detail" aria-live="polite">
          {day
            ? day.planned > 0
              ? t('stats.dayDetail', { day: formatDayShort(day.date), done: day.done, planned: day.planned })
              : t('stats.dayDetailNone', { day: formatDayShort(day.date) })
            : t('stats.dailyHint')}
        </span>
      </div>
    </div>
  )
}
