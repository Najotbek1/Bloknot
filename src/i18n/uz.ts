// All user-facing text lives here. Add ru.ts / en.ts with the same keys to support more languages.
export const uz = {
  'app.name': 'Bloknot',
  'app.tagline': 'Rejalaringiz, maqsadlaringiz va eslatmalaringiz bir joyda',
  'home.comingSoon': 'Ilova qurilmoqda. Tez orada topshiriqlar, bloknotlar va statistika shu yerda paydo bo‘ladi.',
  'app.version': 'Versiya {version}',
} as const

export type MessageKey = keyof typeof uz
