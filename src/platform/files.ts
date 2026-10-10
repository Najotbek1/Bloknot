import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Hands a text file to the user. On the phone it opens Android's share sheet (Telegram, Drive,
 * Files, …); in the browser (and later the desktop app) it downloads the file.
 */
export async function shareTextFile(name: string, text: string, dialogTitle: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: name, files: [uri], dialogTitle })
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Lets the user pick a file and returns its text, or `null` if they cancelled.
 * No type filter: a `.bloknot` file arriving from Telegram may have no known type on the phone;
 * the content is checked after reading.
 */
export function pickTextFile(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) return resolve(null)
      file.text().then((text) => resolve({ name: file.name, text }), reject)
    })
    input.addEventListener('cancel', () => {
      input.remove()
      resolve(null)
    })
    document.body.append(input)
    input.click()
  })
}
