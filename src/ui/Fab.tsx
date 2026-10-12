import { PlusIcon } from './icons'

/** Floating "+" button above the bottom navigation; on a computer it also shows its label. */
export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="fab" aria-label={label} title={`${label} (Ctrl+N)`} onClick={onClick}>
      <PlusIcon size={28} />
      <span className="fab__label" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}
