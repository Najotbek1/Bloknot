import type { ComponentType } from 'react'
import { t, type MessageKey } from '../i18n'
import { CalendarIcon, NotebookIcon, SettingsIcon, StatsIcon, TodayIcon } from '../ui/icons'
import './BottomNav.css'

export type TabId = 'today' | 'plan' | 'notebooks' | 'stats' | 'settings'

const TABS: { id: TabId; label: MessageKey; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'today', label: 'nav.today', Icon: TodayIcon },
  { id: 'plan', label: 'nav.plan', Icon: CalendarIcon },
  { id: 'notebooks', label: 'nav.notebooks', Icon: NotebookIcon },
  { id: 'stats', label: 'nav.stats', Icon: StatsIcon },
  { id: 'settings', label: 'nav.settings', Icon: SettingsIcon },
]

export function BottomNav({ active, onSelect }: { active: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="bottom-nav__item"
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon size={22} />
          <span>{t(label)}</span>
        </button>
      ))}
    </nav>
  )
}
