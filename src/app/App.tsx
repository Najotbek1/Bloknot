import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../core/db/schema'
import { getSettings } from '../core/db/tasks'
import type { Language } from '../core/models/types'
import { getLanguage, setLanguage, t } from '../i18n'
import { desktop } from '../platform/desktop'
import { resolveLanguage } from '../i18n/languages'
import { todayKey } from '../core/dates'
import { NotebooksScreen } from '../features/notebooks/NotebooksScreen'
import { PlanScreen, type PlanState } from '../features/plan/PlanScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { TaskEditorProvider } from '../features/tasks/editor'
import { TodayScreen } from '../features/today/TodayScreen'
import { useAdBanner } from '../features/ads/useAdBanner'
import { useAppOpenAd } from '../features/ads/useAppOpenAd'
import { AlarmRinging } from '../features/alarm/AlarmRinging'
import { useAlarmSync } from '../features/alarm/useAlarmSync'
import { useNotificationSync } from '../features/notifications/useNotificationSync'
import { initBackButton } from '../platform/backButton'
import { ToastProvider } from '../ui/Toast'
import { BottomNav, type TabId } from './BottomNav'
import { NavigationContext, type NavigationApi, type NotebooksView } from './navigation'
import { useGlobalErrors } from './useGlobalErrors'

/** Applies the theme chosen in settings; "system" follows the phone. */
function useTheme() {
  const settings = useLiveQuery(() => getSettings(db), [])
  useEffect(() => {
    const root = document.documentElement
    if (!settings || settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme

    // The browser/system bar colour follows the theme's background.
    const syncBarColor = () => {
      const color = getComputedStyle(root).getPropertyValue('--color-bg').trim()
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
    }
    syncBarColor()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', syncBarColor)
    return () => {
      media.removeEventListener('change', syncBarColor)
    }
  }, [settings])
}

/**
 * The UI language from settings ('auto' = the phone's). `t()` reads a module-level language, so it
 * is switched while rendering, before the screens below render, and they are remounted under a
 * new key so every text is rebuilt.
 */
function useLanguage(): Language {
  const settings = useLiveQuery(() => getSettings(db), [])
  const language = settings ? resolveLanguage(settings.language, navigator.languages) : getLanguage()
  if (getLanguage() !== language) setLanguage(language)
  // The Windows app's tray menu speaks the same language.
  useEffect(() => {
    void desktop?.setLabels({ open: t('tray.open'), quit: t('tray.quit'), tooltip: t('app.name') })
  }, [language])
  return language
}

function GlobalErrors() {
  useGlobalErrors()
  return null
}

export default function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [plan, setPlan] = useState<PlanState>(() => ({ tab: 'daily', calendarTab: 'calendar', day: todayKey() }))
  const [notebooks, setNotebooks] = useState<NotebooksView>({ view: 'list' })
  const navigation = useMemo<NavigationApi>(
    () => ({
      openNote: ({ notebookId, noteId, isNew }) => {
        setNotebooks({ view: 'note', notebookId, noteId, isNew })
        setTab('notebooks')
      },
    }),
    [],
  )
  useTheme()
  const language = useLanguage()
  useNotificationSync()
  useAlarmSync()
  useAdBanner()
  useAppOpenAd()

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
    <NavigationContext.Provider value={navigation}>
      <ToastProvider key={language}>
        <GlobalErrors />
        <AlarmRinging />
        <TaskEditorProvider>
          {tab === 'today' && <TodayScreen />}
          {tab === 'plan' && <PlanScreen state={plan} onChange={setPlan} />}
          {tab === 'notebooks' && <NotebooksScreen state={notebooks} onChange={setNotebooks} />}
          {tab === 'stats' && <StatsScreen />}
          {tab === 'settings' && <SettingsScreen />}
          <BottomNav
            active={tab}
            onSelect={(next) => {
              // Tapping Bloknot again while inside a notebook goes back to the list.
              if (next === 'notebooks' && tab === 'notebooks') setNotebooks({ view: 'list' })
              setTab(next)
            }}
          />
        </TaskEditorProvider>
      </ToastProvider>
    </NavigationContext.Provider>
  )
}
