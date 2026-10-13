import { useSyncExternalStore } from 'react'
import { parseFocus, type FocusSession } from '../../core/focus'
import { NOTIFICATIONS_RESYNC_EVENT } from '../../platform/notifications'

/**
 * The one running focus session, kept in this device's storage so the timer carries on when the
 * app is closed and reopened. It is not synced: a timer belongs to the device it runs on.
 */
const KEY = 'maqsad.focus'
const CHANGE = 'maqsad:focus-change'

let cached: { text: string | null; session: FocusSession | null } = { text: null, session: null }

function read(): FocusSession | null {
  let text: string | null = null
  try {
    text = localStorage.getItem(KEY)
  } catch {
    // Storage blocked: no session.
  }
  if (text !== cached.text) cached = { text, session: parseFocus(text) }
  return cached.session
}

export function getFocus(): FocusSession | null {
  return read()
}

export function setFocus(session: FocusSession | null) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch {
    // Not fatal: the timer just will not survive a restart.
  }
  window.dispatchEvent(new Event(CHANGE))
  // The "focus finished" notification is part of the notification plan.
  window.dispatchEvent(new Event(NOTIFICATIONS_RESYNC_EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  return () => window.removeEventListener(CHANGE, onChange)
}

export function useFocus(): FocusSession | null {
  return useSyncExternalStore(subscribe, read)
}

/** The full-screen timer: closed, or open (for `task` when starting a new session). */
export interface FocusView {
  open: boolean
  task: { id: string; title: string } | null
}

const VIEW = 'maqsad:focus-view'
let view: FocusView = { open: false, task: null }

export function openFocus(task?: { id: string; title: string }) {
  view = { open: true, task: task ? { id: task.id, title: task.title } : null }
  window.dispatchEvent(new Event(VIEW))
}

export function closeFocus() {
  view = { open: false, task: null }
  window.dispatchEvent(new Event(VIEW))
}

export function useFocusView(): FocusView {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(VIEW, onChange)
      return () => window.removeEventListener(VIEW, onChange)
    },
    () => view,
  )
}
