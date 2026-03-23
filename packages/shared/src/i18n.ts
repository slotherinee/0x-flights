import type { FlightTicket, NotificationJob, UserCurrency, UserLanguage } from './types'

export const SUPPORTED_CURRENCIES: UserCurrency[] = ['USD', 'EUR', 'RUB', 'GBP']

const CITY_NAMES: Record<string, { ru: string; en: string }> = {
  // Russia
  MOW: { ru: 'Москва', en: 'Moscow' },
  SVO: { ru: 'Москва', en: 'Moscow' },
  DME: { ru: 'Москва', en: 'Moscow' },
  VKO: { ru: 'Москва', en: 'Moscow' },
  ZIA: { ru: 'Москва', en: 'Moscow' },
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
  KGD: { ru: 'Калининград', en: 'Kaliningrad' },
  MRV: { ru: 'Минеральные Воды', en: 'Mineralnye Vody' },
  ASF: { ru: 'Астрахань', en: 'Astrakhan' },
  REN: { ru: 'Оренбург', en: 'Orenburg' },
  TJM: { ru: 'Тюмень', en: 'Tyumen' },
  OMS: { ru: 'Омск', en: 'Omsk' },
  KEJ: { ru: 'Кемерово', en: 'Kemerovo' },
  KJA: { ru: 'Красноярск', en: 'Krasnoyarsk' },
  UUS: { ru: 'Южно-Сахалинск', en: 'Yuzhno-Sakhalinsk' },
  PKC: { ru: 'Петропавловск-Камчатский', en: 'Petropavlovsk-Kamchatsky' },
  YKS: { ru: 'Якутск', en: 'Yakutsk' },
  AAQ: { ru: 'Анапа', en: 'Anapa' },
  GRV: { ru: 'Грозный', en: 'Grozny' },
  MCX: { ru: 'Махачкала', en: 'Makhachkala' },
  NAL: { ru: 'Нальчик', en: 'Nalchik' },
  MQF: { ru: 'Магнитогорск', en: 'Magnitogorsk' },
  KUF: { ru: 'Самара', en: 'Samara' },
  VOG: { ru: 'Волгоград', en: 'Volgograd' },
  SGC: { ru: 'Сургут', en: 'Surgut' },
  HMA: { ru: 'Ханты-Мансийск', en: 'Khanty-Mansiysk' },
  NOJ: { ru: 'Ноябрьск', en: 'Noyabrsk' },
  NBC: { ru: 'Набережные Челны', en: 'Naberezhnye Chelny' },
  BAX: { ru: 'Барнаул', en: 'Barnaul' },
  TOF: { ru: 'Томск', en: 'Tomsk' },
  BTK: { ru: 'Братск', en: 'Bratsk' },
  UUD: { ru: 'Улан-Удэ', en: 'Ulan-Ude' },
  HTA: { ru: 'Чита', en: 'Chita' },
  BQS: { ru: 'Благовещенск', en: 'Blagoveshchensk' },
  GDX: { ru: 'Магадан', en: 'Magadan' },
  MMK: { ru: 'Мурманск', en: 'Murmansk' },
  ARH: { ru: 'Архангельск', en: 'Arkhangelsk' },
  SCW: { ru: 'Сыктывкар', en: 'Syktyvkar' },
  IJK: { ru: 'Ижевск', en: 'Izhevsk' },
  KVX: { ru: 'Киров', en: 'Kirov' },
  PEZ: { ru: 'Пенза', en: 'Penza' },
  CSY: { ru: 'Чебоксары', en: 'Cheboksary' },
  JOK: { ru: 'Йошкар-Ола', en: 'Yoshkar-Ola' },
  SKX: { ru: 'Саранск', en: 'Saransk' },
  SIP: { ru: 'Симферополь', en: 'Simferopol' },
  GDZ: { ru: 'Геленджик', en: 'Gelendzhik' },
  EGO: { ru: 'Белгород', en: 'Belgorod' },
  BZK: { ru: 'Брянск', en: 'Bryansk' },
  PES: { ru: 'Петрозаводск', en: 'Petrozavodsk' },
  VGD: { ru: 'Вологда', en: 'Vologda' },
  NSK: { ru: 'Норильск', en: 'Norilsk' },
  NNM: { ru: 'Нарьян-Мар', en: 'Naryan-Mar' },
  NYM: { ru: 'Надым', en: 'Nadym' },
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
  KIV: { ru: 'Кишинёв', en: 'Chisinau' },
  IEV: { ru: 'Киев', en: 'Kyiv' },
  ODS: { ru: 'Одесса', en: 'Odesa' },
  // Asia
  DXB: { ru: 'Дубай', en: 'Dubai' },
  AUH: { ru: 'Абу-Даби', en: 'Abu Dhabi' },
  SHJ: { ru: 'Шарджа', en: 'Sharjah' },
  DOH: { ru: 'Доха', en: 'Doha' },
  KWI: { ru: 'Кувейт', en: 'Kuwait City' },
  BAH: { ru: 'Манама', en: 'Manama' },
  MCT: { ru: 'Маскат', en: 'Muscat' },
  RUH: { ru: 'Эр-Рияд', en: 'Riyadh' },
  JED: { ru: 'Джедда', en: 'Jeddah' },
  IST: { ru: 'Стамбул', en: 'Istanbul' },
  SAW: { ru: 'Стамбул', en: 'Istanbul' },
  AYT: { ru: 'Анталья', en: 'Antalya' },
  ESB: { ru: 'Анкара', en: 'Ankara' },
  BKK: { ru: 'Бангкок', en: 'Bangkok' },
  DMK: { ru: 'Бангкок', en: 'Bangkok' },
  HKT: { ru: 'Пхукет', en: 'Phuket' },
  KBV: { ru: 'Краби', en: 'Krabi' },
  CNX: { ru: 'Чиангмай', en: 'Chiang Mai' },
  HKG: { ru: 'Гонконг', en: 'Hong Kong' },
  PVG: { ru: 'Шанхай', en: 'Shanghai' },
  SHA: { ru: 'Шанхай', en: 'Shanghai' },
  PEK: { ru: 'Пекин', en: 'Beijing' },
  PKX: { ru: 'Пекин', en: 'Beijing' },
  CAN: { ru: 'Гуанчжоу', en: 'Guangzhou' },
  CTU: { ru: 'Чэнду', en: 'Chengdu' },
  XIY: { ru: 'Сиань', en: 'Xian' },
  SZX: { ru: 'Шэньчжэнь', en: 'Shenzhen' },
  NRT: { ru: 'Токио', en: 'Tokyo' },
  HND: { ru: 'Токио', en: 'Tokyo' },
  KIX: { ru: 'Осака', en: 'Osaka' },
  ITM: { ru: 'Осака', en: 'Osaka' },
  NGO: { ru: 'Нагоя', en: 'Nagoya' },
  CTS: { ru: 'Саппоро', en: 'Sapporo' },
  ICN: { ru: 'Сеул', en: 'Seoul' },
  GMP: { ru: 'Сеул', en: 'Seoul' },
  TPE: { ru: 'Тайбэй', en: 'Taipei' },
  MNL: { ru: 'Манила', en: 'Manila' },
  CEB: { ru: 'Себу', en: 'Cebu' },
  SIN: { ru: 'Сингапур', en: 'Singapore' },
  KUL: { ru: 'Куала-Лумпур', en: 'Kuala Lumpur' },
  CGK: { ru: 'Джакарта', en: 'Jakarta' },
  DPS: { ru: 'Бали', en: 'Bali' },
  SUB: { ru: 'Сурабая', en: 'Surabaya' },
  HAN: { ru: 'Ханой', en: 'Hanoi' },
  SGN: { ru: 'Хошимин', en: 'Ho Chi Minh City' },
  DAD: { ru: 'Дананг', en: 'Da Nang' },
  PNH: { ru: 'Пномпень', en: 'Phnom Penh' },
  REP: { ru: 'Сием-Рип', en: 'Siem Reap' },
  RGN: { ru: 'Янгон', en: 'Yangon' },
  DEL: { ru: 'Дели', en: 'Delhi' },
  BOM: { ru: 'Мумбаи', en: 'Mumbai' },
  BLR: { ru: 'Бангалор', en: 'Bangalore' },
  MAA: { ru: 'Ченнай', en: 'Chennai' },
  CCU: { ru: 'Калькутта', en: 'Kolkata' },
  HYD: { ru: 'Хайдарабад', en: 'Hyderabad' },
  GOI: { ru: 'Гоа', en: 'Goa' },
  CMB: { ru: 'Коломбо', en: 'Colombo' },
  MLE: { ru: 'Мале', en: 'Male' },
  DAC: { ru: 'Дакка', en: 'Dhaka' },
  KTM: { ru: 'Катманду', en: 'Kathmandu' },
  TLV: { ru: 'Тель-Авив', en: 'Tel Aviv' },
  AMM: { ru: 'Амман', en: 'Amman' },
  BEY: { ru: 'Бейрут', en: 'Beirut' },
  // Africa / Middle East
  HRG: { ru: 'Хургада', en: 'Hurghada' },
  SSH: { ru: 'Шарм-эш-Шейх', en: 'Sharm El-Sheikh' },
  CAI: { ru: 'Каир', en: 'Cairo' },
  CMN: { ru: 'Касабланка', en: 'Casablanca' },
  RAK: { ru: 'Марракеш', en: 'Marrakech' },
  TUN: { ru: 'Тунис', en: 'Tunis' },
  ALG: { ru: 'Алжир', en: 'Algiers' },
  NBO: { ru: 'Найроби', en: 'Nairobi' },
  ADD: { ru: 'Аддис-Абеба', en: 'Addis Ababa' },
  JNB: { ru: 'Йоханнесбург', en: 'Johannesburg' },
  CPT: { ru: 'Кейптаун', en: 'Cape Town' },
  LOS: { ru: 'Лагос', en: 'Lagos' },
  ACC: { ru: 'Аккра', en: 'Accra' },
  ZNZ: { ru: 'Занзибар', en: 'Zanzibar' },
  // Europe
  CDG: { ru: 'Париж', en: 'Paris' },
  ORY: { ru: 'Париж', en: 'Paris' },
  LHR: { ru: 'Лондон', en: 'London' },
  LGW: { ru: 'Лондон', en: 'London' },
  STN: { ru: 'Лондон', en: 'London' },
  LTN: { ru: 'Лондон', en: 'London' },
  FCO: { ru: 'Рим', en: 'Rome' },
  CIA: { ru: 'Рим', en: 'Rome' },
  MXP: { ru: 'Милан', en: 'Milan' },
  LIN: { ru: 'Милан', en: 'Milan' },
  BGY: { ru: 'Милан', en: 'Milan' },
  VCE: { ru: 'Венеция', en: 'Venice' },
  NAP: { ru: 'Неаполь', en: 'Naples' },
  BCN: { ru: 'Барселона', en: 'Barcelona' },
  MAD: { ru: 'Мадрид', en: 'Madrid' },
  AGP: { ru: 'Малага', en: 'Malaga' },
  PMI: { ru: 'Пальма-де-Майорка', en: 'Palma de Mallorca' },
  SVQ: { ru: 'Севилья', en: 'Seville' },
  VLC: { ru: 'Валенсия', en: 'Valencia' },
  FRA: { ru: 'Франкфурт', en: 'Frankfurt' },
  MUC: { ru: 'Мюнхен', en: 'Munich' },
  TXL: { ru: 'Берлин', en: 'Berlin' },
  BER: { ru: 'Берлин', en: 'Berlin' },
  HAM: { ru: 'Гамбург', en: 'Hamburg' },
  DUS: { ru: 'Дюссельдорф', en: 'Dusseldorf' },
  STR: { ru: 'Штутгарт', en: 'Stuttgart' },
  CGN: { ru: 'Кёльн', en: 'Cologne' },
  AMS: { ru: 'Амстердам', en: 'Amsterdam' },
  BRU: { ru: 'Брюссель', en: 'Brussels' },
  VIE: { ru: 'Вена', en: 'Vienna' },
  ZRH: { ru: 'Цюрих', en: 'Zurich' },
  GVA: { ru: 'Женева', en: 'Geneva' },
  PRG: { ru: 'Прага', en: 'Prague' },
  BUD: { ru: 'Будапешт', en: 'Budapest' },
  WAW: { ru: 'Варшава', en: 'Warsaw' },
  KRK: { ru: 'Краков', en: 'Krakow' },
  WRO: { ru: 'Вроцлав', en: 'Wroclaw' },
  ATH: { ru: 'Афины', en: 'Athens' },
  SKG: { ru: 'Салоники', en: 'Thessaloniki' },
  HER: { ru: 'Ираклион', en: 'Heraklion' },
  RHO: { ru: 'Родос', en: 'Rhodes' },
  OTP: { ru: 'Бухарест', en: 'Bucharest' },
  SOF: { ru: 'София', en: 'Sofia' },
  BEG: { ru: 'Белград', en: 'Belgrade' },
  ZAG: { ru: 'Загреб', en: 'Zagreb' },
  LJU: { ru: 'Любляна', en: 'Ljubljana' },
  TGD: { ru: 'Подгорица', en: 'Podgorica' },
  DBV: { ru: 'Дубровник', en: 'Dubrovnik' },
  SPU: { ru: 'Сплит', en: 'Split' },
  SKP: { ru: 'Скопье', en: 'Skopje' },
  TIA: { ru: 'Тирана', en: 'Tirana' },
  LIS: { ru: 'Лиссабон', en: 'Lisbon' },
  OPO: { ru: 'Порту', en: 'Porto' },
  FAO: { ru: 'Фару', en: 'Faro' },
  ARN: { ru: 'Стокгольм', en: 'Stockholm' },
  OSL: { ru: 'Осло', en: 'Oslo' },
  CPH: { ru: 'Копенгаген', en: 'Copenhagen' },
  HEL: { ru: 'Хельсинки', en: 'Helsinki' },
  TLL: { ru: 'Таллин', en: 'Tallinn' },
  RIX: { ru: 'Рига', en: 'Riga' },
  VNO: { ru: 'Вильнюс', en: 'Vilnius' },
  DUB: { ru: 'Дублин', en: 'Dublin' },
  EDI: { ru: 'Эдинбург', en: 'Edinburgh' },
  MAN: { ru: 'Манчестер', en: 'Manchester' },
  BHX: { ru: 'Бирмингем', en: 'Birmingham' },
  NTE: { ru: 'Нант', en: 'Nantes' },
  LYS: { ru: 'Лион', en: 'Lyon' },
  MRS: { ru: 'Марсель', en: 'Marseille' },
  NCE: { ru: 'Ницца', en: 'Nice' },
  TLS: { ru: 'Тулуза', en: 'Toulouse' },
  BOD: { ru: 'Бордо', en: 'Bordeaux' },
  // Americas — USA
  JFK: { ru: 'Нью-Йорк', en: 'New York' },
  EWR: { ru: 'Нью-Йорк', en: 'New York' },
  LGA: { ru: 'Нью-Йорк', en: 'New York' },
  LAX: { ru: 'Лос-Анджелес', en: 'Los Angeles' },
  SFO: { ru: 'Сан-Франциско', en: 'San Francisco' },
  SJC: { ru: 'Сан-Хосе', en: 'San Jose' },
  OAK: { ru: 'Окленд', en: 'Oakland' },
  MIA: { ru: 'Майами', en: 'Miami' },
  FLL: { ru: 'Форт-Лодердейл', en: 'Fort Lauderdale' },
  MCO: { ru: 'Орландо', en: 'Orlando' },
  TPA: { ru: 'Тампа', en: 'Tampa' },
  ORD: { ru: 'Чикаго', en: 'Chicago' },
  MDW: { ru: 'Чикаго', en: 'Chicago' },
  ATL: { ru: 'Атланта', en: 'Atlanta' },
  DFW: { ru: 'Даллас', en: 'Dallas' },
  DAL: { ru: 'Даллас', en: 'Dallas' },
  IAH: { ru: 'Хьюстон', en: 'Houston' },
  HOU: { ru: 'Хьюстон', en: 'Houston' },
  DEN: { ru: 'Денвер', en: 'Denver' },
  SEA: { ru: 'Сиэтл', en: 'Seattle' },
  LAS: { ru: 'Лас-Вегас', en: 'Las Vegas' },
  PHX: { ru: 'Финикс', en: 'Phoenix' },
  BOS: { ru: 'Бостон', en: 'Boston' },
  DCA: { ru: 'Вашингтон', en: 'Washington DC' },
  IAD: { ru: 'Вашингтон', en: 'Washington DC' },
  BWI: { ru: 'Вашингтон', en: 'Washington DC' },
  PHL: { ru: 'Филадельфия', en: 'Philadelphia' },
  MSP: { ru: 'Миннеаполис', en: 'Minneapolis' },
  DTW: { ru: 'Детройт', en: 'Detroit' },
  CLT: { ru: 'Шарлотт', en: 'Charlotte' },
  SAN: { ru: 'Сан-Диего', en: 'San Diego' },
  PDX: { ru: 'Портленд', en: 'Portland' },
  SLC: { ru: 'Солт-Лейк-Сити', en: 'Salt Lake City' },
  HNL: { ru: 'Гонолулу', en: 'Honolulu' },
  ANC: { ru: 'Анкоридж', en: 'Anchorage' },
  // Americas — Canada & Mexico
  YYZ: { ru: 'Торонто', en: 'Toronto' },
  YVR: { ru: 'Ванкувер', en: 'Vancouver' },
  YUL: { ru: 'Монреаль', en: 'Montreal' },
  YYC: { ru: 'Калгари', en: 'Calgary' },
  YEG: { ru: 'Эдмонтон', en: 'Edmonton' },
  MEX: { ru: 'Мехико', en: 'Mexico City' },
  CUN: { ru: 'Канкун', en: 'Cancun' },
  GDL: { ru: 'Гвадалахара', en: 'Guadalajara' },
  MTY: { ru: 'Монтеррей', en: 'Monterrey' },
  // Americas — South America
  GRU: { ru: 'Сан-Паулу', en: 'São Paulo' },
  CGH: { ru: 'Сан-Паулу', en: 'São Paulo' },
  GIG: { ru: 'Рио-де-Жанейро', en: 'Rio de Janeiro' },
  SDU: { ru: 'Рио-де-Жанейро', en: 'Rio de Janeiro' },
  BSB: { ru: 'Бразилиа', en: 'Brasilia' },
  SSA: { ru: 'Сальвадор', en: 'Salvador' },
  FOR: { ru: 'Форталеза', en: 'Fortaleza' },
  REC: { ru: 'Ресифи', en: 'Recife' },
  CWB: { ru: 'Куритиба', en: 'Curitiba' },
  POA: { ru: 'Порту-Алегри', en: 'Porto Alegre' },
  EZE: { ru: 'Буэнос-Айрес', en: 'Buenos Aires' },
  AEP: { ru: 'Буэнос-Айрес', en: 'Buenos Aires' },
  SCL: { ru: 'Сантьяго', en: 'Santiago' },
  BOG: { ru: 'Богота', en: 'Bogota' },
  MDE: { ru: 'Медельин', en: 'Medellin' },
  CTG: { ru: 'Картахена', en: 'Cartagena' },
  LIM: { ru: 'Лима', en: 'Lima' },
  UIO: { ru: 'Кито', en: 'Quito' },
  GYE: { ru: 'Гуаякиль', en: 'Guayaquil' },
  CCS: { ru: 'Каракас', en: 'Caracas' },
  MVD: { ru: 'Монтевидео', en: 'Montevideo' },
  ASU: { ru: 'Асунсьон', en: 'Asuncion' },
  LPB: { ru: 'Ла-Пас', en: 'La Paz' },
  HAV: { ru: 'Гавана', en: 'Havana' },
  SJO: { ru: 'Сан-Хосе', en: 'San José' },
  PTY: { ru: 'Панама', en: 'Panama City' },
  // Oceania
  SYD: { ru: 'Сидней', en: 'Sydney' },
  MEL: { ru: 'Мельбурн', en: 'Melbourne' },
  BNE: { ru: 'Брисбен', en: 'Brisbane' },
  PER: { ru: 'Перт', en: 'Perth' },
  AKL: { ru: 'Окленд', en: 'Auckland' },
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
