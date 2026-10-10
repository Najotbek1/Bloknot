import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/**
 * The alarm clock. On Android a native plugin (android/.../alarm/) rings through AlarmManager and
 * a foreground service; elsewhere alarms can be set up but do not ring, and "test" only shows the
 * ringing screen (no sound) so it can be tried and tested in a browser.
 */
export const alarmsSupported = Capacitor.getPlatform() === 'android'

export interface RingingAlarm {
  nativeId: number
  /** The alarm's record id, or 'test'. */
  alarmId: string
  label: string
  /** When it started ringing (epoch ms); also seeds which text has to be typed. */
  since: number
}

export interface NativeAlarm {
  id: number
  at: number
  alarmId: string
  label: string
  /** Shown in the ringing notification. */
  title: string
  body: string
  ringtone: string
}

export interface AlarmStatus {
  exact: boolean
  fullScreen: boolean
  notifications: boolean
}

export type AlarmSettingsScreen = 'exact' | 'fullScreen' | 'notifications' | 'app'

interface MaqsadAlarmPlugin {
  setSchedule(options: { alarms: NativeAlarm[] }): Promise<void>
  getRinging(): Promise<{ ringing?: RingingAlarm | null }>
  stop(): Promise<void>
  testRing(options: { seconds: number; label: string; title: string; body: string; ringtone: string }): Promise<void>
  pickRingtone(options: { current?: string }): Promise<{ cancelled: boolean; uri?: string | null; title?: string | null }>
  getStatus(): Promise<AlarmStatus>
  openSettings(options: { which: AlarmSettingsScreen }): Promise<void>
  addListener(event: 'ringing', listener: (ringing: RingingAlarm) => void): Promise<PluginListenerHandle>
}

const native = registerPlugin<MaqsadAlarmPlugin>('MaqsadAlarm')

// Browser stand-in for the ringing state, used by "test".
let fakeRinging: RingingAlarm | null = null
const fakeListeners = new Set<(ringing: RingingAlarm) => void>()

function warn(step: string, error: unknown) {
  console.warn(`Alarm: ${step} failed`, error)
}

export async function setAlarmSchedule(alarms: NativeAlarm[]): Promise<void> {
  if (!alarmsSupported) return
  try {
    await native.setSchedule({ alarms })
  } catch (error) {
    warn('schedule', error)
  }
}

export async function getRingingAlarm(): Promise<RingingAlarm | null> {
  if (!alarmsSupported) return fakeRinging
  try {
    return (await native.getRinging()).ringing ?? null
  } catch (error) {
    warn('getRinging', error)
    return null
  }
}

export async function stopAlarm(): Promise<void> {
  if (!alarmsSupported) {
    fakeRinging = null
    return
  }
  await native.stop()
}

export async function testAlarm(options: { seconds: number; label: string; title: string; body: string; ringtone: string | null }) {
  if (alarmsSupported) {
    await native.testRing({ ...options, ringtone: options.ringtone ?? '' })
    return
  }
  window.setTimeout(() => {
    fakeRinging = { nativeId: 0, alarmId: 'test', label: options.label, since: Date.now() }
    for (const listener of fakeListeners) listener(fakeRinging)
  }, options.seconds * 1000)
}

/** The phone's ringtone picker; `null` when cancelled, `uri: null` for the default alarm sound. */
export async function pickRingtone(current: string | null): Promise<{ uri: string | null; title: string | null } | null> {
  if (!alarmsSupported) return null
  const result = await native.pickRingtone({ current: current ?? undefined })
  return result.cancelled ? null : { uri: result.uri ?? null, title: result.title ?? null }
}

export async function getAlarmStatus(): Promise<AlarmStatus | null> {
  if (!alarmsSupported) return null
  try {
    return await native.getStatus()
  } catch (error) {
    warn('status', error)
    return null
  }
}

export async function openAlarmSettings(which: AlarmSettingsScreen): Promise<void> {
  if (alarmsSupported) await native.openSettings({ which })
}

export function onAlarmRinging(listener: (ringing: RingingAlarm) => void): () => void {
  if (!alarmsSupported) {
    fakeListeners.add(listener)
    return () => {
      fakeListeners.delete(listener)
    }
  }
  const handle = native.addListener('ringing', listener)
  return () => {
    void handle.then((h) => h.remove())
  }
}
