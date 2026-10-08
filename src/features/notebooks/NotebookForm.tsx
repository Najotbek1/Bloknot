import { useState, type FormEvent } from 'react'
import { createNotebook, deleteNotebook, updateNotebook } from '../../core/db/notebooks'
import { db } from '../../core/db/schema'
import type { Notebook } from '../../core/models/types'
import { t } from '../../i18n'
import { useToast } from '../../ui/toastContext'
import { DEFAULT_NOTEBOOK_COLOR, NOTEBOOK_COLORS } from './colors'

interface NotebookFormProps {
  notebook?: Notebook
  noteCount?: number
  onDone: (result?: { created?: Notebook; deleted?: boolean }) => void
}

export function NotebookForm({ notebook, noteCount = 0, onDone }: NotebookFormProps) {
  const [title, setTitle] = useState(notebook?.title ?? '')
  const [color, setColor] = useState<string>(notebook?.color ?? DEFAULT_NOTEBOOK_COLOR)
  const [error, setError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return setError(true)
    if (notebook) {
      await updateNotebook(db, notebook.id, { title, color })
      toast.show(t('notebooks.saved'))
      onDone()
    } else {
      onDone({ created: await createNotebook(db, { title, color }) })
    }
  }

  async function remove() {
    if (!notebook) return
    if (!confirmDelete) return setConfirmDelete(true)
    await deleteNotebook(db, notebook.id)
    toast.show(t('notebooks.deleted'))
    onDone({ deleted: true })
  }

  return (
    <form onSubmit={save} noValidate>
      <label className="field">
        <span className="field__label">{t('notebooks.name')}</span>
        <input
          className="input"
          value={title}
          placeholder={t('notebooks.namePlaceholder')}
          autoFocus={!notebook}
          enterKeyHint="done"
          aria-invalid={error}
          onChange={(event) => {
            setTitle(event.target.value)
            setError(false)
          }}
        />
      </label>

      <div className="field">
        <span className="field__label">{t('notebooks.color')}</span>
        <div className="swatches" role="radiogroup" aria-label={t('notebooks.color')}>
          {NOTEBOOK_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              className="swatch"
              aria-checked={color === value}
              aria-label={value}
              style={{ background: value }}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
      </div>

      {notebook && (
        <button type="button" className="btn btn--danger btn--block" onClick={() => void remove()}>
          {confirmDelete ? t('notebooks.deleteConfirm', { count: noteCount }) : t('notebooks.delete')}
        </button>
      )}

      <div className="form-actions">
        {error && (
          <p className="form-error" role="alert">
            {t('task.error.title')}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          {t('task.save')}
        </button>
      </div>
    </form>
  )
}
