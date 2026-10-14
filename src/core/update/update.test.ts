import { describe, expect, it } from 'vitest'
import { compareVersions, isStoreInstall, parseVersionFile, updateToAnnounce } from './update'

describe('compareVersions', () => {
  it('compares part by part, not as text', () => {
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1)
    expect(compareVersions('0.7.0', '0.13.0')).toBe(-1)
    expect(compareVersions('1.0', '1.0.0')).toBe(0)
    expect(compareVersions('1.2.3-beta', '1.2.3')).toBe(0)
  })

  it('treats garbage as equal, so nothing is announced', () => {
    expect(compareVersions('abc', '0.7.0')).toBe(0)
  })
})

describe('parseVersionFile', () => {
  it('reads the version and refuses anything else', () => {
    expect(parseVersionFile('{"version":"0.8.0"}')).toBe('0.8.0')
    expect(parseVersionFile('{"version":8}')).toBeNull()
    expect(parseVersionFile('{"version":"latest"}')).toBeNull()
    expect(parseVersionFile('<html>')).toBeNull()
  })
})

describe('updateToAnnounce', () => {
  const base = { current: '0.7.0', snoozedUntil: 0, now: 1000 }

  it('announces only a newer version', () => {
    expect(updateToAnnounce({ ...base, latest: '0.8.0' })).toBe('0.8.0')
    expect(updateToAnnounce({ ...base, latest: '0.7.0' })).toBeNull()
    expect(updateToAnnounce({ ...base, latest: '0.6.0' })).toBeNull()
    expect(updateToAnnounce({ ...base, latest: null })).toBeNull()
  })

  it('stays quiet while «Later» lasts, then comes back', () => {
    expect(updateToAnnounce({ ...base, latest: '0.8.0', snoozedUntil: 2000 })).toBeNull()
    expect(updateToAnnounce({ ...base, latest: '0.8.0', snoozedUntil: 2000, now: 2000 })).toBe('0.8.0')
  })
})

describe('isStoreInstall', () => {
  it('leaves store installs to their store', () => {
    expect(isStoreInstall('com.android.vending')).toBe(true)
    expect(isStoreInstall('com.sec.android.app.samsungapps')).toBe(true)
    expect(isStoreInstall('com.xiaomi.mipicks')).toBe(true)
    expect(isStoreInstall('org.telegram.messenger')).toBe(false)
    expect(isStoreInstall('com.google.android.packageinstaller')).toBe(false)
    expect(isStoreInstall(null)).toBe(false)
  })
})
