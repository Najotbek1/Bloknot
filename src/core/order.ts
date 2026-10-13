/** The list with the item at `from` moved to `to` (both clamped to the list). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const result = [...list]
  if (from < 0 || from >= result.length) return result
  const [item] = result.splice(from, 1)
  result.splice(Math.max(0, Math.min(to, result.length)), 0, item)
  return result
}
