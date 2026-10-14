import { Capacitor, registerPlugin } from '@capacitor/core'

interface MaqsadAppInfoPlugin {
  getInstaller(): Promise<{ installer?: string | null }>
}

const native = registerPlugin<MaqsadAppInfoPlugin>('MaqsadAppInfo')

/** The package that installed the Android app (a store, or the system installer for an APK); null if unknown. */
export async function getInstaller(): Promise<string | null> {
  if (Capacitor.getPlatform() !== 'android') return null
  try {
    return (await native.getInstaller()).installer ?? null
  } catch (error) {
    console.warn('App info: installer lookup failed', error)
    return null
  }
}
