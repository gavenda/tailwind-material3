/** Small date helpers. Dates are local, compared by calendar day. */

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Adds months, clamping the day so Jan 31 + 1 month is Feb 28/29. */
export function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last))
}

export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export function inRange(d: Date, min?: Date | null, max?: Date | null) {
  const t = startOfDay(d).getTime()
  return (!min || t >= startOfDay(min).getTime()) && (!max || t <= startOfDay(max).getTime())
}

/** First day of the week for a locale (0 = Sunday), from Intl when the browser knows it. */
export function firstDayOfWeek(locale?: string): number {
  try {
    const loc = new Intl.Locale(locale ?? navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    if (info) return info.firstDay % 7 // Intl uses 1–7 with 7 = Sunday
  } catch {
    // Unknown locale or no weekInfo support.
  }
  return 0
}

/** 6 weeks of days covering the month, starting on `firstDay`. */
export function monthGrid(month: Date, firstDay: number): Date[] {
  const first = startOfMonth(month)
  const offset = (first.getDay() - firstDay + 7) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/** Parses a date typed in the locale's numeric format (e.g. 12/31/2026 or 31.12.2026). */
export function parseDate(text: string, locale?: string): Date | null {
  const nums = text.match(/\d+/g)?.map(Number)
  if (!nums || nums.length !== 3) return null
  const order = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(2000, 0, 2))
    .filter((p) => p.type === 'year' || p.type === 'month' || p.type === 'day')
    .map((p) => p.type)
  const v: Record<string, number> = {}
  order.forEach((type, i) => (v[type] = nums[i]))
  const d = new Date(v.year, v.month - 1, v.day)
  return d.getFullYear() === v.year && d.getMonth() === v.month - 1 && d.getDate() === v.day ? d : null
}

/** The locale's numeric date pattern, e.g. "MM/DD/YYYY". */
export function datePattern(locale?: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(2000, 0, 2))
    .map((p) => (p.type === 'year' ? 'YYYY' : p.type === 'month' ? 'MM' : p.type === 'day' ? 'DD' : p.value))
    .join('')
}

export const formatNumeric = (d: Date | null | undefined, locale?: string) =>
  d ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : ''
