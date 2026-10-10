/**
 * The Windows (Electron) app. Its preload script (desktop/preload.cjs) puts `maqsadDesktop` on
 * window; in the browser and on the phone it is absent and everything here is a no-op.
 */
export interface DesktopNotification {
  id: number
  /** Epoch ms. */
  at: number
  title: string
  body: string
}

export interface DesktopApi {
  platform: string
  /** Replaces the planned notifications; the main process shows each when its time comes. */
  scheduleNotifications(items: DesktopNotification[]): Promise<void>
  /** Shows one notification right away (Settings → test). */
  notifyNow(item: { title: string; body: string }): Promise<void>
  /** Texts of the tray icon and its menu, in the current language. */
  setLabels(labels: { open: string; quit: string; tooltip: string }): Promise<void>
  getAutoStart(): Promise<boolean>
  setAutoStart(enabled: boolean): Promise<void>
}

export const desktop: DesktopApi | undefined = (window as unknown as { maqsadDesktop?: DesktopApi }).maqsadDesktop

export const isDesktop = desktop !== undefined
