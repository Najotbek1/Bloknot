import type { Note, Notebook } from '../models/types'
import { createRecord, getActive, listActive, softDelete, updateRecord, type RecordChanges } from './repository'
import type { BloknotDB } from './schema'

/** A notebook with what the list screen shows about its notes. */
export interface NotebookSummary {
  notebook: Notebook
  noteCount: number
  /** Latest change to the notebook or any of its notes. */
  lastUpdated: number
}

export const DEFAULT_NOTEBOOK_ID = 'default-notebook'

export async function createNotebook(
  db: BloknotDB,
  input: { title: string; color: string },
  now: number = Date.now(),
): Promise<Notebook> {
  const title = input.title.trim()
  if (!title) throw new Error('Notebook title is required')
  return createRecord(db.notebooks, { title, color: input.color, order: now }, now)
}

export async function updateNotebook(
  db: BloknotDB,
  id: string,
  changes: RecordChanges<Notebook>,
  now: number = Date.now(),
): Promise<Notebook> {
  if (changes.title !== undefined) {
    changes = { ...changes, title: changes.title.trim() }
    if (!changes.title) throw new Error('Notebook title is required')
  }
  return updateRecord(db.notebooks, id, changes, now)
}

/** Deletes a notebook together with its notes (soft delete, so other devices learn about it). */
export async function deleteNotebook(db: BloknotDB, id: string, now: number = Date.now()): Promise<void> {
  await db.transaction('rw', db.notebooks, db.notes, async () => {
    const notes = await db.notes.where('notebookId').equals(id).toArray()
    for (const note of notes) await softDelete(db.notes, note.id, now)
    await softDelete(db.notebooks, id, now)
  })
}

/**
 * The notebook new notes go to when none is chosen (e.g. a note added from a task).
 * It has a fixed id, so two devices never create two of them; a deleted one is brought back.
 */
export async function ensureDefaultNotebook(
  db: BloknotDB,
  title: string,
  color: string,
  now: number = Date.now(),
): Promise<Notebook> {
  const existing = await db.notebooks.get(DEFAULT_NOTEBOOK_ID)
  if (existing && existing.deletedAt === null) return existing
  if (existing) {
    const restored = { ...existing, deletedAt: null, updatedAt: Math.max(now, existing.updatedAt + 1) }
    await db.notebooks.put(restored)
    return restored
  }
  return createRecord(db.notebooks, { id: DEFAULT_NOTEBOOK_ID, title, color, order: 0 }, now)
}

export async function listNotebooks(db: BloknotDB): Promise<NotebookSummary[]> {
  const [notebooks, notes] = await Promise.all([listActive(db.notebooks), listActive(db.notes)])
  return notebooks
    .map((notebook) => {
      const own = notes.filter((note) => note.notebookId === notebook.id)
      return {
        notebook,
        noteCount: own.length,
        lastUpdated: Math.max(notebook.updatedAt, ...own.map((note) => note.updatedAt)),
      }
    })
    .sort((a, b) => a.notebook.order - b.notebook.order || a.notebook.createdAt - b.notebook.createdAt)
}

/** Notes of a notebook, most recently changed first. */
export async function listNotes(db: BloknotDB, notebookId: string): Promise<Note[]> {
  const notes = await db.notes.where('notebookId').equals(notebookId).toArray()
  return notes.filter((note) => note.deletedAt === null).sort((a, b) => b.updatedAt - a.updatedAt)
}

/** All notes that are not deleted and whose notebook is not deleted. */
export async function listAllNotes(db: BloknotDB): Promise<Note[]> {
  const [notebooks, notes] = await Promise.all([listActive(db.notebooks), listActive(db.notes)])
  const alive = new Set(notebooks.map((notebook) => notebook.id))
  return notes.filter((note) => alive.has(note.notebookId)).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getNotesForTask(db: BloknotDB, taskId: string): Promise<Note[]> {
  const notes = await db.notes.where('taskId').equals(taskId).toArray()
  return notes.filter((note) => note.deletedAt === null).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function createNote(
  db: BloknotDB,
  input: { notebookId: string; title?: string; body?: string; taskId?: string | null },
  now: number = Date.now(),
): Promise<Note> {
  if (!(await getActive(db.notebooks, input.notebookId))) {
    throw new Error(`Notebook not found: ${input.notebookId}`)
  }
  return createRecord(
    db.notes,
    { notebookId: input.notebookId, title: input.title ?? '', body: input.body ?? '', taskId: input.taskId ?? null },
    now,
  )
}

export function updateNote(
  db: BloknotDB,
  id: string,
  changes: RecordChanges<Note>,
  now: number = Date.now(),
): Promise<Note> {
  return updateRecord(db.notes, id, changes, now)
}

export function deleteNote(db: BloknotDB, id: string, now: number = Date.now()): Promise<void> {
  return softDelete(db.notes, id, now)
}

export function isNoteEmpty(note: Pick<Note, 'title' | 'body'>): boolean {
  return !note.title.trim() && !note.body.trim()
}
