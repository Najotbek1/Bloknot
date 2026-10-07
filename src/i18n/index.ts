import { uz, type MessageKey } from './uz'

const messages: Record<MessageKey, string> = uz

/** Returns the translated text for `key`, replacing `{name}` placeholders with `params`. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
