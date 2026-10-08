import type { Note } from './models/types'

/** Every way people type the Uzbek apostrophe in o‘ / g‘ and the tutuq belgisi. */
const APOSTROPHES = /[‘’ʻʼ`´']/g

/** Lower-cases and unifies apostrophes so "o'qish", "o‘qish" and "oʻqish" match each other. */
export function normalizeForSearch(text: string): string {
  return text.toLocaleLowerCase('uz').replace(APOSTROPHES, "'")
}

export interface NoteMatch {
  note: Note
  /** A short piece of the note around the first match, for the result list. */
  snippet: string
}

const SNIPPET_LENGTH = 80

function snippetAround(text: string, index: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= SNIPPET_LENGTH) return flat
  const start = Math.max(0, Math.min(index - SNIPPET_LENGTH / 4, flat.length - SNIPPET_LENGTH))
  const piece = flat.slice(start, start + SNIPPET_LENGTH).trim()
  return `${start > 0 ? '…' : ''}${piece}${start + SNIPPET_LENGTH < flat.length ? '…' : ''}`
}

/**
 * Notes whose title or body contain every word of `query`, in the given order of `notes`.
 * An empty query matches nothing.
 */
export function searchNotes(notes: Note[], query: string): NoteMatch[] {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const matches: NoteMatch[] = []
  for (const note of notes) {
    const title = normalizeForSearch(note.title)
    const body = normalizeForSearch(note.body)
    if (!words.every((word) => title.includes(word) || body.includes(word))) continue
    // Normalizing (almost always) keeps string length, so the index also points into `note.body`.
    const bodyIndex = words.map((word) => body.indexOf(word)).find((index) => index >= 0) ?? 0
    matches.push({ note, snippet: snippetAround(note.body, bodyIndex) })
  }
  return matches
}
