import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { createNote, listNotes } from '../../core/db/notebooks'
import { getActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import { t } from '../../i18n'
import { Fab } from '../../ui/Fab'
import { ChevronLeftIcon, PencilIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { NotebookForm } from './NotebookForm'
import { NoteCard } from './NoteCard'

interface NotebookViewProps {
  notebookId: string
  onBack: () => void
  onOpenNote: (noteId: string, isNew?: boolean) => void
}

export function NotebookView({ notebookId, onBack, onOpenNote }: NotebookViewProps) {
  // `null` = loaded but missing (e.g. deleted on another screen); `undefined` = still loading.
  const notebook = useLiveQuery(async () => (await getActive(db.notebooks, notebookId)) ?? null, [notebookId])
  const notes = useLiveQuery(() => listNotes(db, notebookId), [notebookId])
  const [editing, setEditing] = useState(false)

  if (notebook === null) {
    return (
      <main className="screen">
        <button type="button" className="btn" onClick={onBack}>
          {t('notebooks.back')}
        </button>
      </main>
    )
  }

  async function addNote() {
    const note = await createNote(db, { notebookId })
    onOpenNote(note.id, true)
  }

  return (
    <main className="screen">
      <header className="screen__header subpage-header">
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('notebooks.back')}>
          <ChevronLeftIcon />
        </button>
        <span className="notebook-dot" style={{ background: notebook?.color }} aria-hidden="true" />
        <h1 className="screen__title subpage-header__title">{notebook?.title}</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setEditing(true)}
          aria-label={t('notebooks.edit')}
          disabled={!notebook}
        >
          <PencilIcon size={20} />
        </button>
      </header>

      <section className="section">
        {notes?.length === 0 && <p className="card empty">{t('notes.empty')}</p>}
        {notes && notes.length > 0 && (
          <ul className="note-list">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onOpen={() => onOpenNote(note.id)} />
            ))}
          </ul>
        )}
      </section>

      <Fab label={t('notes.add')} onClick={() => void addNote()} />

      {notebook && (
        <Sheet open={editing} title={t('notebooks.edit')} onClose={() => setEditing(false)} closeLabel={t('task.cancel')}>
          <NotebookForm
            notebook={notebook}
            noteCount={notes?.length ?? 0}
            onDone={(result) => {
              setEditing(false)
              if (result?.deleted) onBack()
            }}
          />
        </Sheet>
      )}
    </main>
  )
}
