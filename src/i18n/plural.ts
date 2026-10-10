/**
 * Fills a message: `{name}` takes `params.name`, and
 * `{count, plural, one {# plan} other {# plans}}` picks a form by Intl.PluralRules for `locale`
 * (categories zero, one, two, few, many, other; `=0`, `=1`… match exact numbers), with `#` = the number.
 */
export function formatMessage(template: string, params: Record<string, string | number>, locale: string): string {
  let result = ''
  let index = 0
  while (index < template.length) {
    const open = template.indexOf('{', index)
    if (open === -1) {
      result += template.slice(index)
      break
    }
    result += template.slice(index, open)
    const close = matchingBrace(template, open)
    if (close === -1) {
      result += template.slice(open)
      break
    }
    result += fill(template.slice(open + 1, close), params, locale, template.slice(open, close + 1))
    index = close + 1
  }
  return result
}

function matchingBrace(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i
  }
  return -1
}

function fill(body: string, params: Record<string, string | number>, locale: string, original: string): string {
  const plural = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(body)
  if (!plural) {
    const name = body.trim()
    return name in params ? String(params[name]) : original
  }
  const [, name, rest] = plural
  if (!(name in params)) return original
  const value = Number(params[name])
  const options = parseOptions(rest)
  const chosen =
    options.get(`=${value}`) ?? options.get(new Intl.PluralRules(locale).select(value)) ?? options.get('other') ?? ''
  return formatMessage(chosen.replace(/#/g, String(params[name])), params, locale)
}

function parseOptions(text: string): Map<string, string> {
  const options = new Map<string, string>()
  let index = 0
  while (index < text.length) {
    const match = /\s*(=?\w+)\s*\{/y
    match.lastIndex = index
    const found = match.exec(text)
    if (!found) break
    const open = match.lastIndex - 1
    const close = matchingBrace(text, open)
    if (close === -1) break
    options.set(found[1], text.slice(open + 1, close))
    index = close + 1
  }
  return options
}
