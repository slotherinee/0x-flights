export type Lang = 'en' | 'ru'

export type CityEntry = {
  iata: string
  en: string
  ru: string
  aliasesEn?: string[]
  aliasesRu?: string[]
}
