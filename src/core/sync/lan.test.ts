import { describe, expect, it } from 'vitest'
import { createTask } from '../db/tasks'
import { createTestDb } from '../db/testing'
import { getAllTasks } from '../queries'
import { readAll } from './backup'
import {
  answerSyncRequest,
  applySyncResponse,
  buildSyncRequest,
  decryptText,
  encodePairing,
  encryptText,
  generateKey,
  LanSyncError,
  parsePairing,
  refusalCode,
} from './lan'

const code = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return (error as LanSyncError).code
  }
}

describe('pairing', () => {
  it('round-trips through the QR text', () => {
    const key = generateKey()
    const text = encodePairing({ hosts: ['192.168.1.5', '10.0.0.7'], port: 47123, key })
    expect(text.startsWith('maqsad-sync:1?')).toBe(true)
    expect(parsePairing(text)).toEqual({ hosts: ['192.168.1.5', '10.0.0.7'], port: 47123, key })
  })

  it('refuses anything that is not a Maqsad pairing', () => {
    const key = encodePairing({ hosts: ['192.168.1.5'], port: 1, key: generateKey() }).split('k=')[1]
    expect(parsePairing('https://example.com')).toBeNull()
    expect(parsePairing('maqsad-sync:1?h=example.com&p=80&k=' + key)).toBeNull()
    expect(parsePairing('maqsad-sync:1?h=192.168.1.5&p=0&k=' + key)).toBeNull()
    expect(parsePairing('maqsad-sync:1?h=192.168.1.5&p=80&k=short')).toBeNull()
    expect(parsePairing('maqsad-sync:1?h=192.168.1.5&p=80&k=%%%')).toBeNull()
  })
})

describe('encryption', () => {
  it('opens only with the same key and direction', async () => {
    const key = generateKey()
    const sealed = await encryptText(key, 'salom', 'request')
    expect(sealed).not.toContain('salom')
    expect(await decryptText(key, sealed, 'request')).toBe('salom')
    expect(await code(decryptText(generateKey(), sealed, 'request'))).toBe('badKey')
    // A reply cannot be passed off as a request.
    expect(await code(decryptText(key, sealed, 'response'))).toBe('badKey')
    expect(await code(decryptText(key, 'not json', 'request'))).toBe('badPayload')
  })
})

describe('phone ↔ computer sync', () => {
  const titles = async (db: ReturnType<typeof createTestDb>) => (await getAllTasks(db)).map((t) => t.title).sort()

  it('leaves both sides with the merged data', async () => {
    const phone = createTestDb()
    const computer = createTestDb()
    await createTask(phone, { title: 'Telefonda', kind: 'daily', date: '2026-10-12' }, 1000)
    await createTask(computer, { title: 'Kompyuterda', kind: 'daily', date: '2026-10-12' }, 2000)
    const key = generateKey()

    const answer = await answerSyncRequest(computer, key, await buildSyncRequest(phone, key, '0.7.0'), '0.7.0')
    expect(answer.status).toBe(200)
    expect(answer.report?.added).toBe(1)
    const report = await applySyncResponse(phone, key, answer.body)
    expect(report.added).toBe(1)

    expect(await titles(phone)).toEqual(['Kompyuterda', 'Telefonda'])
    expect(await readAll(phone)).toEqual(await readAll(computer))
  })

  it('refuses a request sealed with another key without touching the data', async () => {
    const phone = createTestDb()
    const computer = createTestDb()
    await createTask(phone, { title: 'Telefonda', kind: 'daily', date: '2026-10-12' }, 1000)

    const answer = await answerSyncRequest(computer, generateKey(), await buildSyncRequest(phone, generateKey(), '0.7.0'), '0.7.0')
    expect(answer.status).toBe(403)
    expect(refusalCode(answer.body)).toBe('badKey')
    expect(await titles(computer)).toEqual([])
  })

  it('refuses data from a newer app version', async () => {
    const key = generateKey()
    const newer = JSON.stringify({ format: 'bloknot', version: 99, data: {} })
    const answer = await answerSyncRequest(createTestDb(), key, await encryptText(key, newer, 'request'), '0.7.0')
    expect(answer.status).toBe(422)
    expect(refusalCode(answer.body)).toBe('newerVersion')
  })
})
