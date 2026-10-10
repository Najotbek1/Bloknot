import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { adConfig } from '../../platform/adConfig'
import {
  adPrivacyOptionsAvailable,
  adsSupported,
  onAppOpenStatus,
  showAdPrivacyOptions,
  type AppOpenStatus,
} from '../../platform/ads'

/** Settings → Reklama: what the ad is for, and the privacy form where the law requires one. */
export function AdSettings() {
  const [privacyAvailable, setPrivacyAvailable] = useState(false)
  const [appOpen, setAppOpen] = useState<AppOpenStatus>({ state: 'idle' })

  useEffect(() => {
    let active = true
    void adPrivacyOptionsAvailable().then((available) => active && setPrivacyAvailable(available))
    const stopStatus = onAppOpenStatus(setAppOpen)
    return () => {
      active = false
      stopStatus()
    }
  }, [])

  if (!adsSupported) return null
  return (
    <section className="section">
      <h2 className="section__title">{t('ads.title')}</h2>
      <div className="stack">
        <p className="field__hint">{t('ads.intro')}</p>
        <p className="field__hint">{t('ads.appOpenNote')}</p>
        {adConfig.useTestAds && <p className="field__hint">{t('ads.testMode')}</p>}
        {/* While testing, show what the opening ad is doing, so a problem on the phone is visible. */}
        {adConfig.appOpenTest && (
          <p className="field__hint" data-testid="app-open-status">
            {t('ads.appOpenStatus', {
              status:
                appOpen.state === 'error'
                  ? t('ads.status.error', { message: appOpen.message })
                  : t(`ads.status.${appOpen.state}`),
            })}
          </p>
        )}
        {privacyAvailable && (
          <button type="button" className="btn" onClick={() => void showAdPrivacyOptions()}>
            {t('ads.privacy')}
          </button>
        )}
      </div>
    </section>
  )
}
