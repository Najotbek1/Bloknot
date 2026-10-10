import 'fake-indexeddb/auto'
import { BloknotDB } from './schema'

/** A fresh, empty in-memory database for one test. */
export function createTestDb(): BloknotDB {
  return new BloknotDB(`test-${crypto.randomUUID()}`)
}
