import { useEffect, useRef, type ReactNode } from 'react'
import { pushBackHandler } from '../platform/backButton'
import { CloseIcon } from './icons'
import './Sheet.css'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  closeLabel: string
}

/** Bottom sheet built on the native modal <dialog>, so focus and Escape work out of the box. */
export function Sheet({ open, title, onClose, children, closeLabel }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) return
    return pushBackHandler(() => onCloseRef.current())
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="sheet__content">
          <header className="sheet__header">
            <h2 className="sheet__title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
              <CloseIcon />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
