/**
 * The ad banner is a native view drawn over the app, so it must step aside whenever it would cover
 * something: an open sheet, the note editor, the keyboard. Each of those holds a "blocker"; the
 * banner shows only while nobody holds one.
 */
export class AdBlockers {
  private count = 0
  private readonly listeners = new Set<(blocked: boolean) => void>()

  get blocked(): boolean {
    return this.count > 0
  }

  /** Blocks the banner until the returned function is called (calling it twice is harmless). */
  push(): () => void {
    this.set(this.count + 1)
    let released = false
    return () => {
      if (released) return
      released = true
      this.set(Math.max(0, this.count - 1))
    }
  }

  subscribe(listener: (blocked: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private set(count: number) {
    const wasBlocked = this.blocked
    this.count = count
    if (wasBlocked !== this.blocked) for (const listener of this.listeners) listener(this.blocked)
  }
}

/** The app's single set of blockers. */
export const adBlockers = new AdBlockers()

/** Hides the banner while something covers the screen; call from a component's effect. */
export function pushAdBlocker(): () => void {
  return adBlockers.push()
}

/** Whether something covers the screen right now (no full-screen ad over an open sheet). */
export function isAdBlocked(): boolean {
  return adBlockers.blocked
}
