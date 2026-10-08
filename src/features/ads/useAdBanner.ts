import { useEffect } from 'react'
import { adsSupported, initAds, onBannerHeight, setBannerVisible } from '../../platform/ads'
import { adBlockers, pushAdBlocker } from './blockers'

const EDITABLE = 'input, textarea, select, [contenteditable="true"]'

/**
 * Runs the bottom banner for the whole app: shows it when nothing covers the screen, hides it for
 * sheets, the note editor and the on-screen keyboard, and publishes its height as `--ad-height`
 * so screens, the "+" button and toasts move up instead of hiding behind it.
 */
export function useAdBanner() {
  useEffect(() => {
    if (!adsSupported) return
    const root = document.documentElement

    const stopHeight = onBannerHeight((height) => {
      root.style.setProperty('--ad-height', `${Math.max(0, Math.round(height))}px`)
    })
    const stopBlockers = adBlockers.subscribe((blocked) => {
      void setBannerVisible(!blocked)
    })

    // A focused text field means the keyboard is (about to be) open.
    let releaseKeyboard: (() => void) | null = null
    const onFocusIn = (event: FocusEvent) => {
      if (!releaseKeyboard && event.target instanceof Element && event.target.matches(EDITABLE)) {
        releaseKeyboard = pushAdBlocker()
      }
    }
    const onFocusOut = () => {
      // Wait a moment: focus may be moving straight to another field.
      window.setTimeout(() => {
        if (releaseKeyboard && !document.activeElement?.matches(EDITABLE)) {
          releaseKeyboard()
          releaseKeyboard = null
        }
      }, 100)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    void initAds().then((canShow) => {
      if (canShow && !adBlockers.blocked) void setBannerVisible(true)
    })

    return () => {
      stopHeight()
      stopBlockers()
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      releaseKeyboard?.()
    }
  }, [])
}
