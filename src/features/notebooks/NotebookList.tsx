import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { listAllNotes, listNotebooks } from '../../core/db/notebooks'
import { db } from '../../core/db/schema'
import { searchNotes } from '../../core/search'
import { t } from '../../i18n'
import { formatUpdated } from '../../i18n/format'
import { Fab } from '../../ui/Fab'
import { SearchIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { NotebookForm } from './NotebookForm'
import { NoteCard } from './NoteCard'

interface NotebookListProps {
  onOpenNotebook: (notebookId: string) => void
  onOpenNote: (notebookId: string, noteId: string) => void
}

export function NotebookList({ onOpenNotebook, onOpenNote }: NotebookListProps) {
  const notebooks = useLiveQuery(() => listNotebooks(db), [])
  const allNotes = useLiveQuery(() => listAllNotes(db), [])
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const results = useMemo(() => (allNotes ? searchNotes(allNotes, query) : []), [allNotes, query])
  const notebookById = useMemo(
    () => new Map((notebooks ?? []).map((summary) => [summary.notebook.id, summary.notebook])),
    [notebooks],
  )
  const searching = query.trim().length > 0

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('notebooks.title')}</h1>
      </header>

      {notebooks && notebooks.length > 0 && (
        <label className="search">
          <SearchIcon size={20} />
          <input
            className="search__input"
            type="search"
            value={query}
            placeholder={t('notebooks.search')}
            aria-label={t('notebooks.search')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}

      {searching ? (
        <section className="section">
          {results.length === 0 ? (
            <p className="card empty">{t('notebooks.noResults', { query: query.trim() })}</p>
          ) : (
            <ul className="note-list">
              {results.map(({ note, snippet }) => {
                const notebook = notebookById.get(note.notebookId)
                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    preview={snippet}
                    caption={notebook ? t('notebooks.in', { notebook: notebook.title }) : undefined}
                    color={notebook?.color}
                    onOpen={() => onOpenNote(note.notebookId, note.id)}
                  />
                )
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="section">
          {notebooks?.length === 0 && <p className="card empty">{t('notebooks.empty')}</p>}
          {notebooks && notebooks.length > 0 && (
            <ul className="notebook-list">
              {notebooks.map(({ notebook, noteCount, lastUpdated }) => (
                <li key={notebook.id}>
                  <button type="button" className="notebook-card card" onClick={() => onOpenNotebook(notebook.id)}>
                    <span className="notebook-card__spine" style={{ background: notebook.color }} aria-hidden="true" />
                    <span className="notebook-card__body">
                      <span className="notebook-card__title">{notebook.title}</span>
                      <span className="notebook-card__meta">
                        {t('notebooks.noteCount', { count: noteCount })} ·{' '}
                        {t('notebooks.updated', { when: formatUpdated(lastUpdated) })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Fab label={t('notebooks.add')} onClick={() => setCreating(true)} />

      <Sheet open={creating} title={t('notebooks.new')} onClose={() => setCreating(false)} closeLabel={t('task.cancel')}>
        <NotebookForm
          onDone={(result) => {
            setCreating(false)
            if (result?.created) onOpenNotebook(result.created.id)
          }}
        />
      </Sheet>
    </main>
  )
}
