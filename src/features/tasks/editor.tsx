import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Task } from '../../core/models/types'
import { t } from '../../i18n'
import { Sheet } from '../../ui/Sheet'
import { EditorContext } from './editorContext'
import { TaskForm, type TaskDefaults } from './TaskEditor'

interface Session {
  key: number
  task?: Task
  defaults: TaskDefaults
}

/** Owns the single task editor sheet; any screen can open it through `useTaskEditor()`. */
export function TaskEditorProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  const openNew = useCallback((defaults: TaskDefaults) => setSession({ key: Date.now(), defaults }), [])
  const openEdit = useCallback(
    (task: Task) => setSession({ key: Date.now(), task, defaults: { kind: task.kind } }),
    [],
  )
  const close = useCallback(() => setSession(null), [])
  const api = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit])

  return (
    <EditorContext.Provider value={api}>
      {children}
      <Sheet
        open={session !== null}
        title={session?.task ? t('task.edit') : t('task.new')}
        onClose={close}
        closeLabel={t('task.cancel')}
      >
        {session && (
          <TaskForm key={session.key} task={session.task} defaults={session.defaults} onDone={close} />
        )}
      </Sheet>
    </EditorContext.Provider>
  )
}
