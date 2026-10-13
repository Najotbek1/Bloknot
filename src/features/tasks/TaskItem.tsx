import type { ReactNode, Ref } from 'react'
import type { Task, TaskStatus } from '../../core/models/types'
import { t } from '../../i18n'
import { BellIcon, CheckIcon, RepeatIcon } from '../../ui/icons'
import './TaskItem.css'

interface TaskItemProps {
  task: Task
  status: TaskStatus
  /** Small grey text under the title, e.g. a date range or repeat rule. */
  meta?: string
  /** 0–1, drawn as a thin bar (used for ranges). */
  progress?: number
  onToggle: () => void
  onOpen: () => void
  /** Settings → one-tap done; off = the circle steps todo → in progress → done. */
  oneTapDone?: boolean
  /** Drag grip, shown at the end of the row when the list can be reordered. */
  handle?: ReactNode
  /** This row is being dragged. */
  dragging?: boolean
}

export function TaskItem({
  task,
  status,
  meta,
  progress,
  onToggle,
  onOpen,
  oneTapDone = true,
  handle,
  dragging,
}: TaskItemProps) {
  const done = status === 'done'
  const toggleLabel = done
    ? t('task.markTodo')
    : oneTapDone || status === 'in_progress'
      ? t('task.markDone')
      : t('task.markInProgress')
  const reminderTimes = [...new Set(task.reminders.map((reminder) => reminder.time))].sort().join(', ')
  return (
    <li className={`task task--${status} task--priority-${task.priority}${dragging ? ' task--dragging' : ''}`}>
      <button
        type="button"
        className="task__check"
        aria-pressed={done}
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={onToggle}
      >
        {done && <CheckIcon size={16} strokeWidth={3} />}
      </button>
      <button type="button" className="task__body" onClick={onOpen}>
        <span className="task__title">{task.title}</span>
        {(meta || task.recurrence || reminderTimes || status === 'in_progress' || status === 'skipped') && (
          <span className="task__meta">
            {task.recurrence && <RepeatIcon size={14} aria-label={t('task.recurring')} />}
            {(status === 'in_progress' || status === 'skipped') && (
              <span className={`task__status task__status--${status}`}>{t(`status.${status}`)}</span>
            )}
            {meta && <span>{meta}</span>}
            {reminderTimes && (
              <span className="task__reminder" aria-label={`${t('task.reminders')}: ${reminderTimes}`}>
                <BellIcon size={13} />
                {reminderTimes}
              </span>
            )}
          </span>
        )}
        {progress !== undefined && (
          <span className="progress task__progress" aria-hidden="true">
            <span className="progress__bar" style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        )}
      </button>
      {handle}
    </li>
  )
}

export function TaskListCard({ children, listRef }: { children: ReactNode; listRef?: Ref<HTMLUListElement> }) {
  return (
    <ul className="task-list card" ref={listRef}>
      {children}
    </ul>
  )
}
