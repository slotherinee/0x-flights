const RU_MONTHS: [string, number][] = [
  ['январ', 1], ['янв', 1],
  ['феврал', 2], ['фев', 2],
  ['март', 3], ['мар', 3],
  ['апрел', 4], ['апр', 4],
  ['мая', 5], ['май', 5],
  ['июн', 6],
  ['июл', 7],
  ['август', 8], ['авг', 8],
  ['сентябр', 9], ['сент', 9], ['сен', 9],
  ['октябр', 10], ['окт', 10],
  ['ноябр', 11], ['ноя', 11],
  ['декабр', 12], ['дек', 12],
]

const EN_MONTHS: [string, number][] = [
  ['january', 1], ['jan', 1],
  ['february', 2], ['feb', 2],
  ['march', 3], ['mar', 3],
  ['april', 4], ['apr', 4],
  ['may', 5],
  ['june', 6], ['jun', 6],
  ['july', 7], ['jul', 7],
  ['august', 8], ['aug', 8],
  ['september', 9], ['sept', 9], ['sep', 9],
  ['october', 10], ['oct', 10],
  ['november', 11], ['nov', 11],
  ['december', 12], ['dec', 12],
]

function matchMonth(word: string, table: [string, number][]): number | null {
  const lower = word.toLowerCase()
  for (const [prefix, month] of table) {
    if (lower.startsWith(prefix)) return month
  }
  return null
}

function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(year, month - 1, day)
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function smartYear(month: number, day: number): string | null {
  const now = new Date()
  const year = now.getFullYear()
  const candidate = toISO(year, month, day)
  if (!candidate) return null
  const today = now.toISOString().slice(0, 10)
  return candidate > today ? candidate : toISO(year + 1, month, day)
}

/**
 * Parses a human-friendly date string into YYYY-MM-DD.
 * Supports:
 *   - YYYY-MM-DD
 *   - DD.MM.YYYY / DD/MM/YYYY
 *   - DD.MM (smart year: current or next)
 *   - "12 декабря", "12 дек", "12го декабря", "12 дек 2026"
 *   - "декабря 12", "декабрь 12го 2026"
 *   - "12 december", "december 12th 2026"
 */
export function parseHumanDate(input: string): string | null {
  const s = input.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD.MM.YYYY or DD/MM/YYYY
  const dmyFull = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (dmyFull) return toISO(+dmyFull[3], +dmyFull[2], +dmyFull[1])

  // DD.MM (no year)
  const dmShort = s.match(/^(\d{1,2})[./](\d{1,2})$/)
  if (dmShort) return smartYear(+dmShort[2], +dmShort[1])

  // Russian: "12 декабря [2026]" / "12го декабря [2026]" / "12-го декабря [2026]"
  const ruDayMonth = s.match(/^(\d{1,2})(?:-?(?:го|е|ого|ому|ой|ем))?\s+([а-яёА-ЯЁ]+)(?:\s+(\d{4}))?$/i)
  if (ruDayMonth) {
    const month = matchMonth(ruDayMonth[2], RU_MONTHS)
    if (month) {
      const day = +ruDayMonth[1]
      const year = ruDayMonth[3] ? +ruDayMonth[3] : null
      return year ? toISO(year, month, day) : smartYear(month, day)
    }
  }

  // Russian: "декабря 12 [2026]" / "декабрь 12го [2026]"
  const ruMonthDay = s.match(/^([а-яёА-ЯЁ]+)\s+(\d{1,2})(?:-?(?:го|е|ого|ому|ой|ем))?(?:\s+(\d{4}))?$/i)
  if (ruMonthDay) {
    const month = matchMonth(ruMonthDay[1], RU_MONTHS)
    if (month) {
      const day = +ruMonthDay[2]
      const year = ruMonthDay[3] ? +ruMonthDay[3] : null
      return year ? toISO(year, month, day) : smartYear(month, day)
    }
  }

  // English: "12 december [2026]" / "12th december [2026]"
  const enDayMonth = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?$/)
  if (enDayMonth) {
    const month = matchMonth(enDayMonth[2], EN_MONTHS)
    if (month) {
      const day = +enDayMonth[1]
      const year = enDayMonth[3] ? +enDayMonth[3] : null
      return year ? toISO(year, month, day) : smartYear(month, day)
    }
  }

  // English: "december 12 [2026]" / "december 12th [2026]"
  const enMonthDay = s.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/)
  if (enMonthDay) {
    const month = matchMonth(enMonthDay[1], EN_MONTHS)
    if (month) {
      const day = +enMonthDay[2]
      const year = enMonthDay[3] ? +enMonthDay[3] : null
      return year ? toISO(year, month, day) : smartYear(month, day)
    }
  }

  return null
}
