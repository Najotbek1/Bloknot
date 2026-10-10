import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { getActive, listActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import { getSettings } from '../../core/db/tasks'
import { planNotifications } from '../../core/reminders/plan'
import { NOTIFICATIONS_RESYNC_EVENT, onDoneAction, syncNotifications } from '../../platform/notifications'
import { changeStatus } from '../tasks/actions'

const DEBOUNCE_MS = 1000

/**
 * Keeps the phone's scheduled notifications in line with the data: whenever tasks, their daily
 * statuses or settings change (and when the app comes back to the foreground), the next 30 days
 * of notifications are planned again from scratch.
 */
export function useNotificationSync() {
  useEffect(() => {
    let timer: number | undefined
    let latest: Awaited<ReturnType<typeof load>> | null = null

    const run = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!latest) return
        const plan = planNotifications(latest, latest.settings, new Date())
        syncNotifications(plan).catch((err: unknown) => console.error('Notification sync failed', err))
      }, DEBOUNCE_MS)
    }

    const subscription = liveQuery(load).subscribe({
      next: (data) => {
        latest = data
        run()
      },
      error: (err: unknown) => console.error('Notification data query failed', err),
    })
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(NOTIFICATIONS_RESYNC_EVENT, run)

    // "Bajarildi" pressed on a notification: complete that task (or that day of a recurring task).
    const removeDone = onDoneAction(async (taskId, date) => {
      const task = await getActive(db.tasks, taskId)
      if (task) await changeStatus(db, task, 'done', date)
    })

    return () => {
      window.clearTimeout(timer)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(NOTIFICATIONS_RESYNC_EVENT, run)
      removeDone()
    }
  }, [])
}

async function load() {
  const [tasks, occurrences, settings] = await Promise.all([
    listActive(db.tasks),
    listActive(db.occurrences),
    getSettings(db),
  ])
  return { tasks, occurrences, settings }
}
