import { describe, expect, it } from 'vitest'
import type { Note } from './models/types'
import { normalizeForSearch, searchNotes } from './search'

function note(id: string, title: string, body: string): Note {
  return { id, title, body, notebookId: 'n', taskId: null, createdAt: 0, updatedAt: 0, deletedAt: null }
}

describe('normalizeForSearch', () => {
  it('unifies Uzbek apostrophes and case', () => {
    expect(normalizeForSearch('O‘QISH')).toBe(normalizeForSearch("o'qish"))
    expect(normalizeForSearch('oʻqish')).toBe(normalizeForSearch('o’qish'))
    expect(normalizeForSearch('Ma’lumot')).toBe(normalizeForSearch("ma'lumot"))
  })
})

describe('searchNotes', () => {
  const notes = [
    note('1', 'Kitob o‘qish', 'Har kuni 20 bet'),
    note('2', 'Xarid ro‘yxati', 'Non, sut, tuxum va kitob javoni uchun mix'),
    note('3', 'Imtihon', 'Matematika: hosilalar, integrallar'),
  ]

  it('finds by title or body, ignoring apostrophe style and case', () => {
    expect(searchNotes(notes, "o'qish").map((m) => m.note.id)).toEqual(['1'])
    expect(searchNotes(notes, 'KITOB').map((m) => m.note.id)).toEqual(['1', '2'])
    expect(searchNotes(notes, 'integral').map((m) => m.note.id)).toEqual(['3'])
  })

  it('requires every word', () => {
    expect(searchNotes(notes, 'kitob sut').map((m) => m.note.id)).toEqual(['2'])
    expect(searchNotes(notes, 'kitob imtihon')).toEqual([])
  })

  it('returns nothing for an empty query', () => {
    expect(searchNotes(notes, '   ')).toEqual([])
  })

  it('cuts a snippet around the match in long text', () => {
    const long = note('4', 'Uzun', `${'a '.repeat(100)}MUHIM joy ${'b '.repeat(100)}`)
    const [match] = searchNotes([long], 'muhim')
    expect(match.snippet).toContain('MUHIM joy')
    expect(match.snippet.startsWith('…')).toBe(true)
    expect(match.snippet.endsWith('…')).toBe(true)
    expect(match.snippet.length).toBeLessThanOrEqual(82)
  })
})
