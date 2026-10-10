import { useEffect, useState } from 'react'
import { todayKey } from '../core/dates'
import type { DateKey } from '../core/models/types'

/** Today's date key, refreshed when the day changes or the app comes back to the foreground. */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const refresh = () => setToday(todayKey())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}
