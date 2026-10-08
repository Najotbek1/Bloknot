import { describe, expect, it } from 'vitest'
import { t } from './index'

describe('t', () => {
  it('returns the Uzbek text for a key', () => {
    expect(t('app.name')).toBe('Maqsad')
  })

  it('fills placeholders', () => {
    expect(t('app.version', { version: '1.2.3' })).toBe('Versiya 1.2.3')
  })

  it('leaves unknown placeholders untouched', () => {
    expect(t('app.version')).toBe('Versiya {version}')
  })
})
