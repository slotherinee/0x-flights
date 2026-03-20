import { CITY_ENTRIES } from './data'
import { normalize } from './normalize'
import type { CityEntry, Lang } from './types'

const byIata = new Map<string, CityEntry>(CITY_ENTRIES.map((c) => [c.iata, c]))
const enToIata = new Map<string, string>()
const ruToIata = new Map<string, string>()

for (const city of CITY_ENTRIES) {
  enToIata.set(normalize(city.en), city.iata)
  ruToIata.set(normalize(city.ru), city.iata)
  for (const alias of city.aliasesEn ?? []) enToIata.set(normalize(alias), city.iata)
  for (const alias of city.aliasesRu ?? []) ruToIata.set(normalize(alias), city.iata)
}

export function resolveCityToIata(cityName: string, lang: Lang): string | null {
  const key = normalize(cityName)
  return (lang === 'ru' ? ruToIata : enToIata).get(key) ?? null
}

export function formatCityLabel(iata: string, lang: Lang): string {
  const city = byIata.get(iata)
  if (!city) return iata
  return lang === 'ru' ? `${city.ru} (${iata})` : `${city.en} (${iata})`
}

export function examples(lang: Lang): string {
  return lang === 'ru'
    ? 'Москва, Париж, Токио, Нью-Йорк'
    : 'Moscow, Paris, Tokyo, New York'
}

export function getCityCount(): number {
  return CITY_ENTRIES.length
}
