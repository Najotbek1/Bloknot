import { PlusIcon } from './icons'

/** Floating "+" button above the bottom navigation. */
export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="fab" aria-label={label} title={label} onClick={onClick}>
      <PlusIcon size={28} />
    </button>
  )
}
