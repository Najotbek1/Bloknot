import { db } from '../../core/db/schema'
import { toggleDone } from './actions'
import { useTaskEditor } from './editorContext'
import type { TaskRow } from './rows'
import { TaskItem, TaskListCard } from './TaskItem'

export function TaskRows({ rows }: { rows: TaskRow[] }) {
  const editor = useTaskEditor()
  return (
    <TaskListCard>
      {rows.map((row) => (
        <TaskItem
          key={`${row.task.id}:${row.date ?? ''}`}
          task={row.task}
          status={row.status}
          meta={row.meta}
          progress={row.progress}
          onToggle={() => void toggleDone(db, row.task, row.status, row.date)}
          onOpen={() => editor.openEdit(row.task)}
        />
      ))}
    </TaskListCard>
  )
}
