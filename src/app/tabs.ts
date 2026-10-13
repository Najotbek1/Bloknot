import type { ComponentType } from 'react'
import type { MessageKey } from '../i18n'
import { CalendarIcon, NotebookIcon, SettingsIcon, StatsIcon, TodayIcon } from '../ui/icons'

/** The app's sections, in menu order (also Ctrl+1…5 on a computer). */
export type TabId = 'today' | 'plan' | 'notebooks' | 'stats' | 'settings'

export const TABS: { id: TabId; label: MessageKey; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'today', label: 'nav.today', Icon: TodayIcon },
  { id: 'plan', label: 'nav.plan', Icon: CalendarIcon },
  { id: 'notebooks', label: 'nav.notebooks', Icon: NotebookIcon },
  { id: 'stats', label: 'nav.stats', Icon: StatsIcon },
  { id: 'settings', label: 'nav.settings', Icon: SettingsIcon },
]
