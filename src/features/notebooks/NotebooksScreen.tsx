import { useEffect } from 'react'
import type { NotebooksView } from '../../app/navigation'
import { t } from '../../i18n'
import { pushBackHandler } from '../../platform/backButton'
import { useWideLayout } from '../../ui/useWideLayout'
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
  const wide = useWideLayout()
  const up = (): NotebooksView =>
    state.view === 'note' ? { view: 'notebook', notebookId: state.notebookId } : { view: 'list' }

  useEffect(() => {
    if (state.view === 'list') return
    return pushBackHandler(() => onChange(up()))
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.view])

  // Computer-sized window: inside a notebook, the note list stays beside the open note.
  if (wide && state.view !== 'list') {
    const { notebookId } = state
    return (
      <main className="screen notes-split">
        <NotebookView
          pane
          notebookId={notebookId}
          openNoteId={state.view === 'note' ? state.noteId : undefined}
          onBack={() => onChange({ view: 'list' })}
          onOpenNote={(noteId, isNew) => onChange({ view: 'note', notebookId, noteId, isNew })}
        />
        {state.view === 'note' ? (
          <NoteEditor
            key={state.noteId}
            pane
            noteId={state.noteId}
            isNew={state.isNew}
            onBack={() => onChange({ view: 'notebook', notebookId })}
          />
        ) : (
          <p className="card empty notes-split__empty">{t('notes.pick')}</p>
        )}
      </main>
    )
  }

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
