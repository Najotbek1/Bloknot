import { useEffect } from 'react'
import { t } from '../i18n'
import { useToast } from '../ui/toastContext'

/** Errors outside React rendering (event handlers, promises) are shown as a toast, never swallowed. */
export function useGlobalErrors() {
  const toast = useToast()
  useEffect(() => {
    const show = (reason: unknown) =>
      toast.show(t('error.toast', { error: reason instanceof Error ? reason.message : String(reason) }))
    const onError = (event: ErrorEvent) => show(event.error ?? event.message)
    const onRejection = (event: PromiseRejectionEvent) => show(event.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [toast])
}
