import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { SYNC_PATH } from '../core/sync/lan'

/** Wi-Fi sync with the computer is started from the phone app only. */
export const phoneSyncSupported = Capacitor.isNativePlatform()

export type ScanOutcome = { text: string } | { cancelled: true } | { scannerMissing: true }

/**
 * Scans a QR code with Google's code scanner (from Play services: no camera permission needed).
 * The first time the scanner module may still be downloading; it is requested in the background.
 */
export async function scanQr(): Promise<ScanOutcome> {
  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning')
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
  if (!available) {
    void BarcodeScanner.installGoogleBarcodeScannerModule().catch(() => {})
    return { scannerMissing: true }
  }
  try {
    const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
    const text = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue
    return text ? { text } : { cancelled: true }
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return { cancelled: true }
    throw error
  }
}

export class UnreachableError extends Error {
  constructor() {
    super('unreachable')
  }
}

/**
 * Sends the sealed request to the computer, trying each of its addresses in turn. Goes through the
 * native HTTP client: the WebView would block plain http from its https page.
 */
export async function postToComputer(hosts: string[], port: number, body: string): Promise<{ status: number; body: string }> {
  for (const host of hosts) {
    try {
      const response = await CapacitorHttp.request({
        url: `http://${host}:${port}${SYNC_PATH}`,
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        data: body,
        responseType: 'text',
        connectTimeout: 5000,
        readTimeout: 60000,
      })
      return { status: response.status, body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data) }
    } catch {
      // Not reachable at this address; try the next one.
    }
  }
  throw new UnreachableError()
}
