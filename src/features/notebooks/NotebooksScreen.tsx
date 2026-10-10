import { useEffect } from 'react'
import type { NotebooksView } from '../../app/navigation'
import { pushBackHandler } from '../../platform/backButton'
import { NoteEditor } from './NoteEditor'
import { NotebookList } from './NotebookList'
import { NotebookView } from './NotebookView'
import './notebooks.css'

interface NotebooksScreenProps {
  state: NotebooksView
  onChange: (state: NotebooksView) => void
}

/** The Bloknot tab: notebook list → one notebook → one note. Android back goes one level up. */
export function NotebooksScreen({ state, onChange }: NotebooksScreenProps) {
  const up = (): NotebooksView =>
    state.view === 'note' ? { view: 'notebook', notebookId: state.notebookId } : { view: 'list' }

  useEffect(() => {
    if (state.view === 'list') return
    return pushBackHandler(() => onChange(up()))
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.view])

  switch (state.view) {
    case 'list':
      return (
        <NotebookList
          onOpenNotebook={(notebookId) => onChange({ view: 'notebook', notebookId })}
          onOpenNote={(notebookId, noteId) => onChange({ view: 'note', notebookId, noteId })}
        />
      )
    case 'notebook':
      return (
        <NotebookView
          notebookId={state.notebookId}
          onBack={() => onChange({ view: 'list' })}
          onOpenNote={(noteId, isNew) => onChange({ view: 'note', notebookId: state.notebookId, noteId, isNew })}
        />
      )
    case 'note':
      return (
        <NoteEditor
          noteId={state.noteId}
          isNew={state.isNew}
          onBack={() => onChange({ view: 'notebook', notebookId: state.notebookId })}
        />
      )
  }
}
