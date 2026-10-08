import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { db } from '../core/db/schema'
import { getSettings } from '../core/db/tasks'
import { todayKey } from '../core/dates'
import { ComingSoon } from '../features/ComingSoon'
import { PlanScreen, type PlanState } from '../features/plan/PlanScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { TaskEditorProvider } from '../features/tasks/editor'
import { TodayScreen } from '../features/today/TodayScreen'
import { useNotificationSync } from '../features/notifications/useNotificationSync'
import { initBackButton } from '../platform/backButton'
import { ToastProvider } from '../ui/Toast'
import { BottomNav, type TabId } from './BottomNav'
import { useGlobalErrors } from './useGlobalErrors'

/** Applies the theme chosen in settings; "system" follows the phone. */
function useTheme() {
  const settings = useLiveQuery(() => getSettings(db), [])
  useEffect(() => {
    const root = document.documentElement
    if (!settings || settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  }, [settings])
}

function GlobalErrors() {
  useGlobalErrors()
  return null
}

export default function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [plan, setPlan] = useState<PlanState>(() => ({ tab: 'daily', day: todayKey() }))
  useTheme()
  useNotificationSync()

  // Android back button: from any tab go back to "Bugun"; from "Bugun" close the app.
  const tabRef = useRef(tab)
  useEffect(() => {
    tabRef.current = tab
  })
  useEffect(
    () =>
      initBackButton(() => {
        if (tabRef.current === 'today') return false
        setTab('today')
        return true
      }),
    [],
  )

  // Braces matter: newer WebViews return a Promise from scrollTo, and React would call it as cleanup.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  return (
    <ToastProvider>
      <GlobalErrors />
      <TaskEditorProvider>
        {tab === 'today' && <TodayScreen />}
        {tab === 'plan' && <PlanScreen state={plan} onChange={setPlan} />}
        {tab === 'notebooks' && <ComingSoon title="nav.notebooks" message="comingSoon.notebooks" />}
        {tab === 'stats' && <ComingSoon title="nav.stats" message="comingSoon.stats" />}
        {tab === 'settings' && <SettingsScreen />}
        <BottomNav active={tab} onSelect={setTab} />
      </TaskEditorProvider>
    </ToastProvider>
  )
}
