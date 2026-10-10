import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { adConfig } from '../../platform/adConfig'
import { adPrivacyOptionsAvailable, adsSupported, showAdPrivacyOptions } from '../../platform/ads'

/** Settings → Reklama: what the ad is for, and the privacy form where the law requires one. */
export function AdSettings() {
  const [privacyAvailable, setPrivacyAvailable] = useState(false)

  useEffect(() => {
    let active = true
    void adPrivacyOptionsAvailable().then((available) => active && setPrivacyAvailable(available))
    return () => {
      active = false
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
        {privacyAvailable && (
          <button type="button" className="btn" onClick={() => void showAdPrivacyOptions()}>
            {t('ads.privacy')}
          </button>
        )}
      </div>
    </section>
  )
}
