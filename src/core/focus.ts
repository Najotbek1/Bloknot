import type { PlannedNotification } from './reminders/plan'

/**
 * Focus timer (Pomodoro): one running session at a time, for one plan. Pure functions over a plain
 * record, so the session can be kept in storage and survive the app being closed.
 */
export type FocusPhase = 'work' | 'break'

export interface FocusSession {
  taskId: string
  title: string
  phase: FocusPhase
  durationMs: number
  /** Epoch ms when the session (or its last restart) began. */
  startedAt: number
  /** Epoch ms when it was paused; null while running. */
  pausedAt: number | null
  /** Time spent paused before `pausedAt`, so it does not count. */
  pausedMs: number
}

export const FOCUS_MINUTES = [15, 25, 45, 60] as const
export const DEFAULT_FOCUS_MINUTES = 25
export const BREAK_MINUTES = 5

export function startFocus(
  task: { id: string; title: string },
  minutes: number,
  now: number,
  phase: FocusPhase = 'work',
): FocusSession {
  return {
    taskId: task.id,
    title: task.title,
    phase,
    durationMs: minutes * 60_000,
    startedAt: now,
    pausedAt: null,
    pausedMs: 0,
  }
}

function elapsedMs(session: FocusSession, now: number): number {
  const until = session.pausedAt ?? now
  return Math.max(0, until - session.startedAt - session.pausedMs)
}

export function remainingMs(session: FocusSession, now: number): number {
  return Math.max(0, session.durationMs - elapsedMs(session, now))
}

export function isFinished(session: FocusSession, now: number): boolean {
  return remainingMs(session, now) === 0
}

/** When a running session ends; null while paused. */
export function endsAt(session: FocusSession): number | null {
  if (session.pausedAt !== null) return null
  return session.startedAt + session.pausedMs + session.durationMs
}

export function pauseFocus(session: FocusSession, now: number): FocusSession {
  return session.pausedAt !== null ? session : { ...session, pausedAt: now }
}

export function resumeFocus(session: FocusSession, now: number): FocusSession {
  if (session.pausedAt === null) return session
  return { ...session, pausedMs: session.pausedMs + (now - session.pausedAt), pausedAt: null }
}

/** "24:59" for the remaining time, rounded up to whole seconds. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/** Reads a stored session, ignoring anything that is not one. */
export function parseFocus(text: string | null): FocusSession | null {
  if (!text) return null
  try {
    const value = JSON.parse(text) as Partial<FocusSession>
    const ok =
      typeof value.taskId === 'string' &&
      typeof value.title === 'string' &&
      (value.phase === 'work' || value.phase === 'break') &&
      typeof value.durationMs === 'number' &&
      typeof value.startedAt === 'number' &&
      (value.pausedAt === null || typeof value.pausedAt === 'number') &&
      typeof value.pausedMs === 'number'
    return ok ? (value as FocusSession) : null
  } catch {
    return null
  }
}

/** Fixed id of the "focus finished" notification, apart from the plan's 1-based ids. */
export const FOCUS_NOTIFICATION_ID = 99_999

/** The "time is up" notification for a running session, or null (none, paused, or already over). */
export function focusNotification(
  session: FocusSession | null,
  now: number,
  title: string,
): PlannedNotification | null {
  const end = session && endsAt(session)
  if (!session || end === null || end <= now) return null
  return { id: FOCUS_NOTIFICATION_ID, at: new Date(end), kind: 'focus', title, body: session.title }
}
