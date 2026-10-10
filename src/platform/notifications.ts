import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PlannedNotification } from '../core/reminders/plan'
import { t } from '../i18n'

/**
 * Phone notifications. Only the Android app can show them; in the browser (and later the desktop
 * app) every function here does nothing and reports `unsupported`.
 */
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

const CHANNEL_ID = 'reminders'
const TASK_ACTION_TYPE = 'TASK'
const DONE_ACTION = 'done'
const SMALL_ICON = 'ic_stat_bloknot'

export const notificationsSupported = Capacitor.isNativePlatform()

/** Fired after the permission may have changed, so the schedule is rebuilt right away. */
export const NOTIFICATIONS_RESYNC_EVENT = 'bloknot:notifications-resync'

let setup: Promise<void> | null = null

/** Creates the Android channel and the "Bajarildi" button once per app start. */
function ensureSetup(): Promise<void> {
  setup ??= (async () => {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: t('notify.channel'),
      importance: 4,
      visibility: 1,
    })
    await LocalNotifications.registerActionTypes({
      types: [{ id: TASK_ACTION_TYPE, actions: [{ id: DONE_ACTION, title: t('notify.action.done') }] }],
    })
  })()
  return setup
}

function toPermissionState(state: string): PermissionState {
  if (state === 'granted' || state === 'denied') return state
  return 'prompt'
}

export async function getPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported'
  return toPermissionState((await LocalNotifications.checkPermissions()).display)
}

export async function requestPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported'
  const state = toPermissionState((await LocalNotifications.requestPermissions()).display)
  window.dispatchEvent(new Event(NOTIFICATIONS_RESYNC_EVENT))
  return state
}

/** Android 12+: whether notifications may fire at the exact minute (otherwise they can be late). */
export async function getExactAlarmPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported'
  try {
    return toPermissionState((await LocalNotifications.checkExactNotificationSetting()).exact_alarm)
  } catch {
    return 'granted' // Older Android versions have no such setting.
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (notificationsSupported) await LocalNotifications.changeExactNotificationSetting()
}

/** Replaces every pending notification with `plan`. */
export async function syncNotifications(plan: PlannedNotification[]): Promise<void> {
  if (!notificationsSupported || (await getPermission()) !== 'granted') return
  await ensureSetup()
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) })
  }
  if (plan.length === 0) return
  await LocalNotifications.schedule({
    notifications: plan.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      largeBody: item.body,
      schedule: { at: item.at, allowWhileIdle: true },
      channelId: CHANNEL_ID,
      smallIcon: SMALL_ICON,
      autoCancel: true,
      actionTypeId: item.taskId ? TASK_ACTION_TYPE : undefined,
      extra: item.taskId ? { taskId: item.taskId, date: item.date } : undefined,
    })),
  })
}

/** Shows a notification in a few seconds, to check that notifications work on this phone. */
export async function sendTestNotification(): Promise<void> {
  if (!notificationsSupported) return
  await ensureSetup()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 100000,
        title: t('notify.test.title'),
        body: t('notify.test.body'),
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        channelId: CHANNEL_ID,
        smallIcon: SMALL_ICON,
      },
    ],
  })
}

/** Calls `handler` when the "Bajarildi" button of a task notification is pressed. */
export function onDoneAction(handler: (taskId: string, date: string | undefined) => void): () => void {
  if (!notificationsSupported) return () => {}
  const listener = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const extra = action.notification.extra as { taskId?: string; date?: string } | undefined
    if (action.actionId === DONE_ACTION && extra?.taskId) handler(extra.taskId, extra.date)
  })
  return () => void listener.then((l) => l.remove())
}
