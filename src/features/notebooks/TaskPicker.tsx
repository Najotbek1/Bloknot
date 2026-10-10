import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../../core/db/schema'
import type { Task } from '../../core/models/types'
import { getAllTasks } from '../../core/queries'
import { normalizeForSearch } from '../../core/search'
import { t } from '../../i18n'
import { SearchIcon } from '../../ui/icons'
import { describeTaskPlace } from '../tasks/describe'

/** List of tasks with a search box; used inside a Sheet to link a note to a task. */
export function TaskPicker({ onPick }: { onPick: (task: Task) => void }) {
  const tasks = useLiveQuery(() => getAllTasks(db), [])
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    const words = normalizeForSearch(query).split(/\s+/).filter(Boolean)
    return (tasks ?? [])
      .filter((task) => words.every((word) => normalizeForSearch(task.title).includes(word)))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [tasks, query])

  return (
    <div className="task-picker">
      <label className="search">
        <SearchIcon size={20} />
        <input
          className="search__input"
          type="search"
          value={query}
          placeholder={t('notes.searchTasks')}
          aria-label={t('notes.searchTasks')}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {tasks && shown.length === 0 && <p className="empty">{t('notes.noTasks')}</p>}
      <ul className="picker-list">
        {shown.map((task) => (
          <li key={task.id}>
            <button type="button" className="picker-item" onClick={() => onPick(task)}>
              <span className="picker-item__title">{task.title}</span>
              <span className="picker-item__meta">{describeTaskPlace(task)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
