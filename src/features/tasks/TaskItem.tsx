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
}

export function TaskItem({ task, status, meta, progress, onToggle, onOpen }: TaskItemProps) {
  const done = status === 'done'
  const reminderTimes = [...new Set(task.reminders.map((reminder) => reminder.time))].sort().join(', ')
  return (
    <li className={`task task--${status} task--priority-${task.priority}`}>
      <button
        type="button"
        className="task__check"
        aria-pressed={done}
        aria-label={done ? t('task.markTodo') : t('task.markDone')}
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
    </li>
  )
}

export function TaskListCard({ children }: { children: React.ReactNode }) {
  return <ul className="task-list card">{children}</ul>
}
