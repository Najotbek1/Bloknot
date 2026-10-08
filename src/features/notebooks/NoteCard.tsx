import type { Note } from '../../core/models/types'
import { t } from '../../i18n'
import { formatUpdated } from '../../i18n/format'

interface NoteCardProps {
  note: Note
  /** Text under the title; defaults to the start of the note. */
  preview?: string
  /** Extra grey line, e.g. which notebook a search result is in. */
  caption?: string
  color?: string
  onOpen: () => void
}

export function NoteCard({ note, preview, caption, color, onOpen }: NoteCardProps) {
  const text = preview ?? note.body.replace(/\s+/g, ' ').trim()
  return (
    <li>
      <button
        type="button"
        className="note-card card"
        style={color ? { borderLeftColor: color } : undefined}
        onClick={onOpen}
      >
        <span className="note-card__title">{note.title.trim() || t('notes.untitled')}</span>
        <span className="note-card__preview">{text || t('notes.emptyBody')}</span>
        <span className="note-card__meta">
          {caption ? `${caption} · ` : ''}
          {formatUpdated(note.updatedAt)}
        </span>
      </button>
    </li>
  )
}
