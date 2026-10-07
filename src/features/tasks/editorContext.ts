import { createContext, useContext } from 'react'
import type { Task } from '../../core/models/types'
import type { TaskDefaults } from './TaskEditor'

export interface EditorApi {
  openNew: (defaults: TaskDefaults) => void
  openEdit: (task: Task) => void
}

export const EditorContext = createContext<EditorApi | null>(null)

/** Opens the task editor sheet; works anywhere inside `TaskEditorProvider`. */
export function useTaskEditor(): EditorApi {
  const api = useContext(EditorContext)
  if (!api) throw new Error('useTaskEditor must be used inside TaskEditorProvider')
  return api
}
