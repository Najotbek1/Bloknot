import { t } from '../i18n'
import { TABS, type TabId } from './tabs'
import './BottomNav.css'

/**
 * The main menu. On a phone it is the bottom bar; on a computer-sized window (≥ 960px) the same
 * element becomes the side menu with the app's name on top and Settings at the bottom.
 */
export function BottomNav({ active, onSelect }: { active: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__brand">
        <img src="favicon.svg" alt="" width={32} height={32} />
        <span>{t('app.name')}</span>
      </div>
      {TABS.map(({ id, label, Icon }, index) => (
        <button
          key={id}
          type="button"
          className="bottom-nav__item"
          aria-current={active === id ? 'page' : undefined}
          title={`${t(label)} (Ctrl+${index + 1})`}
          onClick={() => onSelect(id)}
        >
          <Icon size={22} />
          <span>{t(label)}</span>
        </button>
      ))}
    </nav>
  )
}
