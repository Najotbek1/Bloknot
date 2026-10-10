import { createContext, useContext } from 'react'

export interface ToastApi {
  show: (message: string) => void
}

export const ToastContext = createContext<ToastApi>({ show: () => {} })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
