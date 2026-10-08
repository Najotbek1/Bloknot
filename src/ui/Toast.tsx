import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ToastContext } from './toastContext'
import './Toast.css'

const DURATION_MS = 3000

/** Shows one short message at a time above the bottom navigation. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  const show = useCallback((message: string) => setToast({ id: Date.now(), message }), [])
  const api = useMemo(() => ({ show }), [show])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
