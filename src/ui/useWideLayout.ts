import { useSyncExternalStore } from 'react'

/** Keep in step with the `@media (min-width: 960px)` blocks in the CSS. */
export const WIDE_QUERY = '(min-width: 960px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** True on a computer-sized window: side menu, two columns, note list beside the editor. */
export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(WIDE_QUERY).matches)
}
