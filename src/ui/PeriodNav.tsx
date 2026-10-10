import { t } from '../i18n'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

interface PeriodNavProps {
  label: string
  isCurrent: boolean
  onPrevious: () => void
  onNext: () => void
  onCurrent: () => void
}

export function PeriodNav({ label, isCurrent, onPrevious, onNext, onCurrent }: PeriodNavProps) {
  return (
    <div className="period-nav">
      <button type="button" className="icon-btn" onClick={onPrevious} aria-label={t('plan.previous')}>
        <ChevronLeftIcon />
      </button>
      <p className="period-nav__label" aria-live="polite">
        {label}
      </p>
      {!isCurrent && (
        <button type="button" className="period-nav__today" onClick={onCurrent}>
          {t('plan.today')}
        </button>
      )}
      <button type="button" className="icon-btn" onClick={onNext} aria-label={t('plan.next')}>
        <ChevronRightIcon />
      </button>
    </div>
  )
}
