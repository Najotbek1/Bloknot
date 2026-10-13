import type { TaskStatus } from './models/types'

/**
 * What tapping a task's circle does. With one-tap done (the default) anything open becomes done
 * and done goes back to "todo". Without it the circle steps through the work:
 * todo (or skipped) → in progress → done → todo — for long study or work sessions.
 */
export function nextStatus(current: TaskStatus, oneTapDone: boolean): TaskStatus {
  if (current === 'done') return 'todo'
  if (oneTapDone || current === 'in_progress') return 'done'
  return 'in_progress'
}
