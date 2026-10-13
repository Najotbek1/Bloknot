import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { db } from '../../core/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, reorderTasks } from '../../core/db/tasks'
import { moveItem } from '../../core/order'
import { t } from '../../i18n'
import { GripIcon } from '../../ui/icons'
import { toggleDone } from './actions'
import { useTaskEditor } from './editorContext'
import type { TaskRow } from './rows'
import { TaskItem, TaskListCard } from './TaskItem'

const keyOf = (row: TaskRow) => `${row.task.id}:${row.date ?? ''}`
const sameOrder = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index])

/**
 * A card of tasks. With `sortable`, each row has a grip: drag it (finger or mouse) or press ↑/↓ on
 * it to change the order, which is saved as the tasks' manual order.
 */
export function TaskRows({ rows, sortable = false }: { rows: TaskRow[]; sortable?: boolean }) {
  const editor = useTaskEditor()
  const oneTapDone = useLiveQuery(() => getSettings(db), [])?.oneTapDone ?? true
  const listRef = useRef<HTMLUListElement>(null)
  /** The order being dragged, or just saved and not yet back from the database. */
  const [pending, setPending] = useState<string[] | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const keys = rows.map(keyOf)
  const pendingFits = pending !== null && sameOrder([...pending].sort(), [...keys].sort())
  // The database caught up, or the list changed under us: show the rows as they are.
  if (pending && dragging === null && (!pendingFits || sameOrder(pending, keys))) setPending(null)
  const byKey = new Map(rows.map((row) => [keyOf(row), row]))
  const order = pending && pendingFits ? pending : keys
  const shown = order.map((key) => byKey.get(key)!)

  function save(next: string[]) {
    setPending(next)
    void reorderTasks(
      db,
      next.map((key) => byKey.get(key)!.task.id),
    )
  }

  // The drag lives in a ref too: pointer events can arrive faster than React re-renders, and the
  // release must save the order the last move produced, not the one of the last render.
  const drag = useRef<{ key: string; order: string[] } | null>(null)

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, key: string) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { key, order }
    setDragging(key)
    setPending(order)
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>, key: string) {
    const current = drag.current
    if (!current || current.key !== key || !listRef.current) return
    const items = [...listRef.current.children] as HTMLElement[]
    let target = items.length - 1
    for (const [index, item] of items.entries()) {
      const box = item.getBoundingClientRect()
      if (event.clientY < box.top + box.height / 2) {
        target = index
        break
      }
    }
    const from = current.order.indexOf(key)
    if (from === target) return
    current.order = moveItem(current.order, from, target)
    setPending(current.order)
  }

  function onPointerUp(key: string) {
    const current = drag.current
    if (!current || current.key !== key) return
    drag.current = null
    setDragging(null)
    if (!sameOrder(current.order, keys)) save(current.order)
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const from = order.indexOf(key)
    const to = from + (event.key === 'ArrowUp' ? -1 : 1)
    if (to < 0 || to >= order.length) return
    save(moveItem(order, from, to))
  }

  return (
    <TaskListCard listRef={listRef}>
      {shown.map((row) => {
        const key = keyOf(row)
        return (
          <TaskItem
            key={key}
            task={row.task}
            status={row.status}
            meta={row.meta}
            progress={row.progress}
            dragging={dragging === key}
            oneTapDone={oneTapDone}
            onToggle={() => void toggleDone(db, row.task, row.status, row.date, oneTapDone)}
            onOpen={() => editor.openEdit(row.task)}
            handle={
              sortable && rows.length > 1 ? (
                <button
                  type="button"
                  className="task__grip"
                  aria-label={t('task.reorder', { title: row.task.title })}
                  title={t('task.reorder', { title: row.task.title })}
                  onPointerDown={(event) => onPointerDown(event, key)}
                  onPointerMove={(event) => onPointerMove(event, key)}
                  onPointerUp={() => onPointerUp(key)}
                  onPointerCancel={() => onPointerUp(key)}
                  onKeyDown={(event) => onKeyDown(event, key)}
                >
                  <GripIcon size={18} />
                </button>
              ) : undefined
            }
          />
        )
      })}
    </TaskListCard>
  )
}
