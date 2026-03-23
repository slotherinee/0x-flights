import type { FlightTicket, NotificationJob, UserCurrency, UserLanguage } from './types'

export const SUPPORTED_CURRENCIES: UserCurrency[] = ['USD', 'EUR', 'RUB', 'GBP']

const CITY_NAMES: Record<string, { ru: string; en: string }> = {
  // Russia
  MOW: { ru: 'Москва', en: 'Moscow' },
  SVO: { ru: 'Москва', en: 'Moscow' },
  DME: { ru: 'Москва', en: 'Moscow' },
  VKO: { ru: 'Москва', en: 'Moscow' },
  LED: { ru: 'Санкт-Петербург', en: 'Saint Petersburg' },
  AER: { ru: 'Сочи', en: 'Sochi' },
  KZN: { ru: 'Казань', en: 'Kazan' },
  SVX: { ru: 'Екатеринбург', en: 'Yekaterinburg' },
  OVB: { ru: 'Новосибирск', en: 'Novosibirsk' },
  KHV: { ru: 'Хабаровск', en: 'Khabarovsk' },
  VVO: { ru: 'Владивосток', en: 'Vladivostok' },
  UFA: { ru: 'Уфа', en: 'Ufa' },
  ROV: { ru: 'Ростов-на-Дону', en: 'Rostov-on-Don' },
  KRR: { ru: 'Краснодар', en: 'Krasnodar' },
  IKT: { ru: 'Иркутск', en: 'Irkutsk' },
  NJC: { ru: 'Нижневартовск', en: 'Nizhnevartovsk' },
  GOJ: { ru: 'Нижний Новгород', en: 'Nizhny Novgorod' },
  CEK: { ru: 'Челябинск', en: 'Chelyabinsk' },
  PEE: { ru: 'Пермь', en: 'Perm' },
  VOZ: { ru: 'Воронеж', en: 'Voronezh' },
  SAR: { ru: 'Саратов', en: 'Saratov' },
  ULV: { ru: 'Ульяновск', en: 'Ulyanovsk' },
  // CIS
  TBS: { ru: 'Тбилиси', en: 'Tbilisi' },
  EVN: { ru: 'Ереван', en: 'Yerevan' },
  GYD: { ru: 'Баку', en: 'Baku' },
  TSE: { ru: 'Астана', en: 'Astana' },
  ALA: { ru: 'Алматы', en: 'Almaty' },
  TAS: { ru: 'Ташкент', en: 'Tashkent' },
  FRU: { ru: 'Бишкек', en: 'Bishkek' },
  DYU: { ru: 'Душанбе', en: 'Dushanbe' },
  ASB: { ru: 'Ашхабад', en: 'Ashgabat' },
  MSQ: { ru: 'Минск', en: 'Minsk' },
  // Asia
  DXB: { ru: 'Дубай', en: 'Dubai' },
  AUH: { ru: 'Абу-Даби', en: 'Abu Dhabi' },
  IST: { ru: 'Стамбул', en: 'Istanbul' },
  SAW: { ru: 'Стамбул', en: 'Istanbul' },
  AYT: { ru: 'Анталья', en: 'Antalya' },
  BKK: { ru: 'Бангкок', en: 'Bangkok' },
  DMK: { ru: 'Бангкок', en: 'Bangkok' },
  HKT: { ru: 'Пхукет', en: 'Phuket' },
  KBV: { ru: 'Краби', en: 'Krabi' },
  HKG: { ru: 'Гонконг', en: 'Hong Kong' },
  PVG: { ru: 'Шанхай', en: 'Shanghai' },
  SHA: { ru: 'Шанхай', en: 'Shanghai' },
  PEK: { ru: 'Пекин', en: 'Beijing' },
  PKX: { ru: 'Пекин', en: 'Beijing' },
  CAN: { ru: 'Гуанчжоу', en: 'Guangzhou' },
  CTU: { ru: 'Чэнду', en: 'Chengdu' },
  NRT: { ru: 'Токио', en: 'Tokyo' },
  HND: { ru: 'Токио', en: 'Tokyo' },
  ICN: { ru: 'Сеул', en: 'Seoul' },
  GMP: { ru: 'Сеул', en: 'Seoul' },
  SIN: { ru: 'Сингапур', en: 'Singapore' },
  KUL: { ru: 'Куала-Лумпур', en: 'Kuala Lumpur' },
  CGK: { ru: 'Джакарта', en: 'Jakarta' },
  DPS: { ru: 'Бали', en: 'Bali' },
  DEL: { ru: 'Дели', en: 'Delhi' },
  BOM: { ru: 'Мумбаи', en: 'Mumbai' },
  CMB: { ru: 'Коломбо', en: 'Colombo' },
  MLE: { ru: 'Мале', en: 'Male' },
  TLV: { ru: 'Тель-Авив', en: 'Tel Aviv' },
  // Africa / Middle East
  HRG: { ru: 'Хургада', en: 'Hurghada' },
  SSH: { ru: 'Шарм-эш-Шейх', en: 'Sharm El-Sheikh' },
  CAI: { ru: 'Каир', en: 'Cairo' },
  // Europe
  CDG: { ru: 'Париж', en: 'Paris' },
  ORY: { ru: 'Париж', en: 'Paris' },
  LHR: { ru: 'Лондон', en: 'London' },
  LGW: { ru: 'Лондон', en: 'London' },
  STN: { ru: 'Лондон', en: 'London' },
  FCO: { ru: 'Рим', en: 'Rome' },
  CIA: { ru: 'Рим', en: 'Rome' },
  BCN: { ru: 'Барселона', en: 'Barcelona' },
  MAD: { ru: 'Мадрид', en: 'Madrid' },
  FRA: { ru: 'Франкфурт', en: 'Frankfurt' },
  MUC: { ru: 'Мюнхен', en: 'Munich' },
  AMS: { ru: 'Амстердам', en: 'Amsterdam' },
  BRU: { ru: 'Брюссель', en: 'Brussels' },
  VIE: { ru: 'Вена', en: 'Vienna' },
  ZRH: { ru: 'Цюрих', en: 'Zurich' },
  GVA: { ru: 'Женева', en: 'Geneva' },
  PRG: { ru: 'Прага', en: 'Prague' },
  BUD: { ru: 'Будапешт', en: 'Budapest' },
  WAW: { ru: 'Варшава', en: 'Warsaw' },
  ATH: { ru: 'Афины', en: 'Athens' },
  // Americas
  JFK: { ru: 'Нью-Йорк', en: 'New York' },
  EWR: { ru: 'Нью-Йорк', en: 'New York' },
  LGA: { ru: 'Нью-Йорк', en: 'New York' },
  LAX: { ru: 'Лос-Анджелес', en: 'Los Angeles' },
  MIA: { ru: 'Майами', en: 'Miami' },
  ORD: { ru: 'Чикаго', en: 'Chicago' },
  YYZ: { ru: 'Торонто', en: 'Toronto' },
  GRU: { ru: 'Сан-Паулу', en: 'São Paulo' },
}

function cityLabel(iata: string, lang: UserLanguage): string {
  const city = CITY_NAMES[iata.toUpperCase()]
  if (!city) return iata.toUpperCase()
  return `${city[lang]} (${iata.toUpperCase()})`
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}.${m}.${y}`
}

export function normalizeLanguage(lang: string | null | undefined): UserLanguage {
  return lang === 'ru' ? 'ru' : 'en'
}

export function normalizeCurrency(value: string | null | undefined): UserCurrency {
  const normalized = (value ?? '').toUpperCase().trim()
  if (normalized === 'EUR' || normalized === 'RUB' || normalized === 'GBP') return normalized
  return 'USD'
}

export function isSupportedCurrency(value: string | null | undefined): value is UserCurrency {
  const normalized = (value ?? '').toUpperCase().trim()
  return normalized === 'USD' || normalized === 'EUR' || normalized === 'RUB' || normalized === 'GBP'
}

const MAX_TICKETS = 5

function cleanTag(tag: string): string {
  return tag.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function renderTickets(tickets: FlightTicket[], currency: string, lang: UserLanguage): string {
  const list = tickets.slice(0, MAX_TICKETS)
  return list.map((t) => {
    const price = Math.round(t.price)
    const stopsLabel = t.isDirect
      ? (lang === 'ru' ? 'прямой' : 'direct')
      : lang === 'ru' ? `${t.stops} пересадка` : `${t.stops} stop${t.stops > 1 ? 's' : ''}`
    const details: string[] = [stopsLabel]
    if (t.duration) details.push(t.duration)
    if (t.airlines) details.push(t.airlines)
    if (t.departureTime && t.arrivalTime) details.push(`${t.departureTime}–${t.arrivalTime}`)
    const tags = t.tags.map(cleanTag).filter(Boolean)
    const tagsLine = tags.length ? `\n🏷 ${tags.join(' · ')}` : ''
    return `*${price} ${currency}* — ${details.join(', ')}${tagsLine}`
  }).join('\n\n')
}

function flexDateLabel(date: string, offset: number, lang: UserLanguage): string {
  const formatted = formatDate(date)
  if (offset === 0) return formatted
  return lang === 'ru' ? `~${formatted} ±${offset}д` : `~${formatted} ±${offset}d`
}

export function buildLocalizedNotificationMessage(
  job: NotificationJob,
  lang: UserLanguage,
): string {
  const depLabel = flexDateLabel(job.departureDate, job.departureOffset, lang)
  const retLabel = job.returnDate ? flexDateLabel(job.returnDate, job.returnOffset, lang) : null
  const dateLabel = retLabel ? `${depLabel} → ${retLabel}` : depLabel

  const originLabel = cityLabel(job.origin, lang)
  const destLabel = cityLabel(job.destination, lang)

  const bookLine = job.ticketUrl ? `\n\n🛒 [${lang === 'ru' ? 'Купить билет' : 'Book ticket'}](${job.ticketUrl})` : ''
  const ticketsBlock = job.tickets?.length
    ? `\n\n${renderTickets(job.tickets, job.currency, lang)}`
    : `\n*${Math.round(job.price)} ${job.currency}*`

  if (lang === 'ru') {
    const tripLabel = job.returnDate ? '🔄 Туда-обратно' : '✈️ В одну сторону'
    const diffLine =
      job.previousPrice != null && job.previousPrice !== job.price
        ? `\n📉 Было: *${Math.round(job.previousPrice)} ${job.currency}* → теперь от *${Math.round(job.price)} ${job.currency}*`
        : ''
    return (
      `🚨 *Снижение цены!*\n\n` +
      `✈️ *${originLabel} → ${destLabel}*\n` +
      `📅 ${dateLabel}  ${tripLabel}\n` +
      `🎯 Ваш порог: ${job.threshold} ${job.currency}` +
      diffLine +
      ticketsBlock +
      bookLine
    )
  }

  const tripLabel = job.returnDate ? '🔄 Round-trip' : '✈️ One-way'
  const diffLine =
    job.previousPrice != null && job.previousPrice !== job.price
      ? `\n📉 Was: *${Math.round(job.previousPrice)} ${job.currency}* → now from *${Math.round(job.price)} ${job.currency}*`
      : ''
  return (
    `🚨 *Price Alert!*\n\n` +
    `✈️ *${originLabel} → ${destLabel}*\n` +
    `📅 ${dateLabel}  ${tripLabel}\n` +
    `🎯 Your threshold: ${job.threshold} ${job.currency}` +
    diffLine +
    ticketsBlock +
    bookLine
  )
}
