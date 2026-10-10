import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { deleteNote, isNoteEmpty, updateNote } from '../../core/db/notebooks'
import { getActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import type { Note } from '../../core/models/types'
import { t } from '../../i18n'
import { ChevronLeftIcon, CloseIcon, LinkIcon, TrashIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toastContext'
import { pushAdBlocker } from '../ads/blockers'
import { useTaskEditor } from '../tasks/editorContext'
import { TaskPicker } from './TaskPicker'

const SAVE_DELAY_MS = 500

interface NoteEditorProps {
  noteId: string
  /** Just created: if it is left empty, it is deleted on the way out. */
  isNew?: boolean
  onBack: () => void
}

export function NoteEditor({ noteId, isNew, onBack }: NoteEditorProps) {
  const note = useLiveQuery(async () => (await getActive(db.notes, noteId)) ?? null, [noteId])
  if (note === undefined) return <main className="screen" />
  if (note === null) {
    return (
      <main className="screen">
        <button type="button" className="btn" onClick={onBack}>
          {t('notebooks.back')}
        </button>
      </main>
    )
  }
  return <NoteForm key={noteId} note={note} isNew={isNew} onBack={onBack} />
}

interface Content {
  title: string
  body: string
}

/**
 * Title and text are saved automatically half a second after typing stops, and right away when
 * leaving the note, so nothing typed can be lost.
 */
function NoteForm({ note, isNew, onBack }: { note: Note; isNew?: boolean; onBack: () => void }) {
  const [content, setContent] = useState<Content>({ title: note.title, body: note.body })
  const [saved, setSaved] = useState<Content>({ title: note.title, body: note.body })
  const [picking, setPicking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()
  const taskEditor = useTaskEditor()
  const linkedTask = useLiveQuery(
    async () => (note.taskId ? ((await getActive(db.tasks, note.taskId)) ?? null) : null),
    [note.taskId],
  )

  const dirty = content.title !== saved.title || content.body !== saved.body

  // Full-screen writing: no ad banner over the text.
  useEffect(() => {
    const releaseAd = pushAdBlocker()
    return releaseAd
  }, [])

  // Debounced autosave.
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      void updateNote(db, note.id, content).then(() => setSaved(content))
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [content, dirty, note.id])

  // On leaving: save what is pending, or drop a new note that stayed empty.
  const latest = useRef({ content, saved, deleted: false })
  useEffect(() => {
    latest.current = { ...latest.current, content, saved }
  })
  useEffect(() => {
    const id = note.id
    return () => {
      const { content: last, saved: lastSaved, deleted } = latest.current
      if (deleted) return
      if (isNew && isNoteEmpty(last)) void deleteNote(db, id)
      else if (last.title !== lastSaved.title || last.body !== lastSaved.body) void updateNote(db, id, last)
    }
  }, [note.id, isNew])

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true)
    latest.current.deleted = true
    await deleteNote(db, note.id)
    toast.show(t('notes.deleted'))
    onBack()
  }

  return (
    <main className="screen note-editor">
      <header className="subpage-header">
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('notebooks.back')}>
          <ChevronLeftIcon />
        </button>
        <span className="note-editor__status" aria-live="polite">
          {dirty ? t('notes.saving') : t('notes.saved')}
        </span>
        <button
          type="button"
          className={`icon-btn ${confirmDelete ? 'icon-btn--danger' : ''}`}
          onClick={() => void remove()}
          aria-label={confirmDelete ? t('notes.deleteConfirm') : t('notes.delete')}
          title={confirmDelete ? t('notes.deleteConfirm') : t('notes.delete')}
        >
          <TrashIcon size={20} />
        </button>
      </header>

      <input
        className="note-editor__title"
        value={content.title}
        placeholder={t('notes.titlePlaceholder')}
        aria-label={t('notes.titlePlaceholder')}
        autoFocus={isNew}
        onChange={(event) => setContent((c) => ({ ...c, title: event.target.value }))}
      />

      <div className="note-editor__link">
        {linkedTask ? (
          <span className="link-chip">
            <button type="button" className="link-chip__open" onClick={() => taskEditor.openEdit(linkedTask)}>
              <LinkIcon size={14} />
              {linkedTask.title}
            </button>
            <button
              type="button"
              className="link-chip__remove"
              aria-label={t('notes.unlinkTask')}
              onClick={() => void updateNote(db, note.id, { taskId: null })}
            >
              <CloseIcon size={14} />
            </button>
          </span>
        ) : (
          <button type="button" className="chip" onClick={() => setPicking(true)}>
            <LinkIcon size={14} /> {t('notes.linkTask')}
          </button>
        )}
      </div>

      <textarea
        className="note-editor__body"
        value={content.body}
        placeholder={t('notes.bodyPlaceholder')}
        aria-label={t('notes.bodyPlaceholder')}
        onChange={(event) => setContent((c) => ({ ...c, body: event.target.value }))}
      />

      <Sheet open={picking} title={t('notes.pickTask')} onClose={() => setPicking(false)} closeLabel={t('task.cancel')}>
        <TaskPicker
          onPick={(task) => {
            setPicking(false)
            void updateNote(db, note.id, { taskId: task.id })
          }}
        />
      </Sheet>
    </main>
  )
}
