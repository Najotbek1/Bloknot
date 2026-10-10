import { useCallback, useEffect, useState } from 'react'
import {
  getExactAlarmPermission,
  getPermission,
  requestPermission,
  type PermissionState,
} from '../../platform/notifications'

interface PermissionInfo {
  permission: PermissionState | null
  exactAlarm: PermissionState | null
}

async function readPermissions(): Promise<PermissionInfo> {
  const [permission, exactAlarm] = await Promise.all([getPermission(), getExactAlarmPermission()])
  return { permission, exactAlarm }
}

/** Notification permission, re-checked when the user comes back from the phone's settings. */
export function useNotificationPermission() {
  const [info, setInfo] = useState<PermissionInfo>({ permission: null, exactAlarm: null })

  useEffect(() => {
    let active = true
    const check = () => readPermissions().then((next) => active && setInfo(next))
    void check()
    const onVisible = () => document.visibilityState === 'visible' && void check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const request = useCallback(async () => {
    await requestPermission()
    setInfo(await readPermissions())
  }, [])

  return { ...info, request }
}
