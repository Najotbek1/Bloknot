import type { BloknotDB } from '../db/schema'
import { BackupError, createBackup, parseBackup, type BackupErrorCode } from './backup'
import { importBackup } from './importBackup'
import type { MergeReport } from './merge'

/**
 * Phone ↔ computer sync over the local Wi-Fi, without a server.
 *
 * The computer listens on its local address and shows a QR code holding that address and a fresh
 * 32-byte key. The phone scans it, sends its backup encrypted with the key, the computer merges it
 * (the same last-write-wins merge as a file import) and answers with its merged data, which the
 * phone merges too. The key never travels over the network, so others on the Wi-Fi cannot read
 * or forge the data.
 */

export const PAIRING_PREFIX = 'maqsad-sync:1?'
export const KEY_BYTES = 32
/** How long a QR code stays valid. */
export const PAIRING_TTL_MS = 5 * 60 * 1000
export const SYNC_PATH = '/sync'

export interface Pairing {
  /** Local IPv4 addresses of the computer, best first. */
  hosts: string[]
  port: number
  key: Uint8Array
}

export type LanSyncErrorCode = 'badKey' | 'badPayload' | BackupErrorCode

export class LanSyncError extends Error {
  readonly code: LanSyncErrorCode
  constructor(code: LanSyncErrorCode) {
    super(code)
    this.code = code
  }
}

export function generateKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(KEY_BYTES))
}

export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  return fromBase64(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

/** The text inside the QR code. */
export function encodePairing({ hosts, port, key }: Pairing): string {
  return `${PAIRING_PREFIX}h=${hosts.join(',')}&p=${port}&k=${toBase64Url(key)}`
}

/** Reads a scanned QR code; anything that is not a valid Maqsad pairing gives null. */
export function parsePairing(text: string): Pairing | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith(PAIRING_PREFIX)) return null
  const params = new URLSearchParams(trimmed.slice(PAIRING_PREFIX.length))
  const hosts = (params.get('h') ?? '').split(',').filter((host) => IPV4.test(host))
  const port = Number(params.get('p'))
  let key: Uint8Array
  try {
    key = fromBase64Url(params.get('k') ?? '')
  } catch {
    return null
  }
  if (hosts.length === 0 || !Number.isInteger(port) || port < 1 || port > 65535 || key.length !== KEY_BYTES) {
    return null
  }
  return { hosts, port, key }
}

/** Which way a message goes; bound into the encryption so a reply cannot be replayed as a request. */
export type Direction = 'request' | 'response'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function importKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', key as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** AES-GCM with a random IV: `{"v":1,"iv":…,"data":…}`. */
export async function encryptText(key: Uint8Array, text: string, direction: Direction): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(direction) },
    await importKey(key),
    encoder.encode(text),
  )
  return JSON.stringify({ v: 1, iv: toBase64Url(iv), data: toBase64Url(new Uint8Array(data)) })
}

/** Throws `badPayload` for anything malformed and `badKey` when it was not sealed with this key. */
export async function decryptText(key: Uint8Array, payload: string, direction: Direction): Promise<string> {
  let iv: Uint8Array
  let data: Uint8Array
  try {
    const raw = JSON.parse(payload) as { v?: unknown; iv?: unknown; data?: unknown }
    if (raw.v !== 1 || typeof raw.iv !== 'string' || typeof raw.data !== 'string') throw new Error()
    iv = fromBase64Url(raw.iv)
    data = fromBase64Url(raw.data)
  } catch {
    throw new LanSyncError('badPayload')
  }
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource, additionalData: encoder.encode(direction) },
      await importKey(key),
      data as BufferSource,
    )
    return decoder.decode(plain)
  } catch {
    throw new LanSyncError('badKey')
  }
}

/** Phone: its whole backup, sealed for the computer. */
export async function buildSyncRequest(db: BloknotDB, key: Uint8Array, appVersion: string): Promise<string> {
  return encryptText(key, JSON.stringify(await createBackup(db, appVersion)), 'request')
}

export interface SyncAnswer {
  /** HTTP status the computer replies with. */
  status: number
  body: string
  /** What changed on the computer; absent when the request was refused. */
  report?: MergeReport
}

/**
 * Computer: merges the phone's backup and answers with its own merged data. Refusals carry only an
 * error code (`{"error":…}`), never data.
 */
export async function answerSyncRequest(
  db: BloknotDB,
  key: Uint8Array,
  body: string,
  appVersion: string,
): Promise<SyncAnswer> {
  try {
    const backup = parseBackup(await decryptText(key, body, 'request'))
    const report = await importBackup(db, backup)
    const reply = await encryptText(key, JSON.stringify(await createBackup(db, appVersion)), 'response')
    return { status: 200, body: reply, report }
  } catch (error) {
    const code: LanSyncErrorCode =
      error instanceof LanSyncError || error instanceof BackupError ? error.code : 'badPayload'
    return { status: code === 'badKey' ? 403 : 422, body: JSON.stringify({ error: code }) }
  }
}

/** Phone: merges the computer's answer. Throws LanSyncError / BackupError. */
export async function applySyncResponse(db: BloknotDB, key: Uint8Array, body: string): Promise<MergeReport> {
  return importBackup(db, parseBackup(await decryptText(key, body, 'response')))
}

/** The error code in a refused answer, if any. */
export function refusalCode(body: string): LanSyncErrorCode | null {
  try {
    const code = (JSON.parse(body) as { error?: unknown }).error
    return typeof code === 'string' ? (code as LanSyncErrorCode) : null
  } catch {
    return null
  }
}
