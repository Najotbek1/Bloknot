import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigation } from '../../app/navigation'
import { createNote, ensureDefaultNotebook, getNotesForTask } from '../../core/db/notebooks'
import { db } from '../../core/db/schema'
import { t } from '../../i18n'
import { NotebookIcon } from '../../ui/icons'
import { useToast } from '../../ui/toastContext'
import { DEFAULT_NOTEBOOK_COLOR } from '../notebooks/colors'

interface TaskNotesProps {
  taskId: string
  /** The task form has unsaved changes; leaving it now would lose them. */
  dirty: boolean
  /** Closes the task editor before the note opens. */
  onLeave: () => void
}

/** Notes linked to a task, shown in the task editor, with a shortcut to write a new one. */
export function TaskNotes({ taskId, dirty, onLeave }: TaskNotesProps) {
  const notes = useLiveQuery(() => getNotesForTask(db, taskId), [taskId])
  const navigation = useNavigation()
  const toast = useToast()

  function canLeave() {
    if (dirty) toast.show(t('notes.saveTaskFirst'))
    return !dirty
  }

  async function addNote() {
    if (!canLeave()) return
    const notebook = await ensureDefaultNotebook(db, t('notebooks.default'), DEFAULT_NOTEBOOK_COLOR)
    const note = await createNote(db, { notebookId: notebook.id, taskId })
    onLeave()
    navigation.openNote({ notebookId: notebook.id, noteId: note.id, isNew: true })
  }

  return (
    <div className="field">
      <span className="field__label">{t('notes.taskNotes')}</span>
      {notes && notes.length > 0 && (
        <ul className="task-notes">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className="task-notes__item"
                onClick={() => {
                  if (!canLeave()) return
                  onLeave()
                  navigation.openNote({ notebookId: note.notebookId, noteId: note.id })
                }}
              >
                <NotebookIcon size={16} />
                <span>{note.title.trim() || note.body.trim().slice(0, 40) || t('notes.untitled')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn add-reminder" onClick={() => void addNote()}>
        {t('notes.addForTask')}
      </button>
    </div>
  )
}
