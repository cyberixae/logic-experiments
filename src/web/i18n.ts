const en = {
  title: 'LK',
  random: 'Random',
  campaign: 'Campaign',
  menu: 'Menu',
  undo: 'Undo',
  level: 'Level',
  paused: 'Paused',
  resumeGame: 'Resume Game',
  resetChallenge: 'Reset Challenge',
  freshChallenge: 'Fresh Challenge',
  changeSettings: 'Change Settings',
  exitToMainMenu: 'Exit to Main Menu',
  left: 'Left',
  right: 'Right',
  drop: 'Drop',
  destruct: 'Destruct',
  rules: 'Rules',
  axiom: 'Axiom',
  playAgain: 'Play Again',
  playAgainShort: 'Again',
  newChallenge: 'New Challenge',
  prevLevel: 'Prev Level',
  prevLevelShort: 'Prev',
  nextLevel: 'Next Level',
  nextLevelShort: 'Next',
  congratulations: '\u{1F389} Conglaturations! \u{1F389}',
  systems: 'Systems',
  backToSystems: '\u2190 Systems',
  sideLeft: 'L',
  sideRight: 'R',
  randomConfig: 'Random',
  formulaShape: 'Settings',
  size: 'Formula Length',
  connectives: 'Connectives',
  symbols: 'Symbols',
  negationWeight: 'Negation',
  implicationWeight: 'Implication',
  conjunctionWeight: 'Conjunction',
  disjunctionWeight: 'Disjunction',
  filter: 'Parameters',
  bypassPercent: 'Chaoticity (💀%)',
  targetNonStructural: 'Solution Size',
  start: 'Start',
  back: 'Back',
  preview: 'Preview',
  score: 'Score',
  par: 'Par',
  statsTemplate:
    'Generated {formulas} formulas ({rate}/s), {tautologies} tautologies, {solved} solved. Updated {sinceUpdate}s ago.',
} as const

const fi: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Satunnainen',
  campaign: 'Kampanja',
  menu: 'Valikko',
  undo: 'Kumoa',
  level: 'Taso',
  paused: 'Pysäytetty',
  resumeGame: 'Jatka peliä',
  resetChallenge: 'Aloita alusta',
  freshChallenge: 'Uusi haaste',
  changeSettings: 'Muuta asetuksia',
  exitToMainMenu: 'Päävalikkoon',
  left: 'Vasen',
  right: 'Oikea',
  drop: 'Pudota',
  destruct: 'Pura',
  rules: 'Säännöt',
  axiom: 'Aksiooma',
  playAgain: 'Pelaa uudestaan',
  playAgainShort: 'Uudestaan',
  newChallenge: 'Uusi haaste',
  prevLevel: 'Edellinen',
  prevLevelShort: 'Edellinen',
  nextLevel: 'Seuraava',
  nextLevelShort: 'Seuraava',
  congratulations: '\u{1F389} Oneski olkoon! \u{1F389}',
  systems: 'Järjestelmät',
  backToSystems: '\u2190 Järjestelmät',
  sideLeft: 'V',
  sideRight: 'O',
  randomConfig: 'Satunnainen',
  formulaShape: 'Asetukset',
  size: 'Kaavan pituus',
  connectives: 'Konnektiivit',
  symbols: 'Symbolit',
  negationWeight: 'Negaatio',
  implicationWeight: 'Implikaatio',
  conjunctionWeight: 'Konjunktio',
  disjunctionWeight: 'Disjunktio',
  filter: 'Parametrit',
  bypassPercent: 'Kaoottisuus (💀%)',
  targetNonStructural: 'Ratkaisun koko',
  start: 'Aloita',
  back: 'Takaisin',
  preview: 'Esikatselu',
  score: 'Pisteet',
  par: 'Par',
  statsTemplate:
    'Tuotettu {formulas} kaavaa ({rate}/s), {tautologies} tautologiaa, {solved} ratkaisua. Päivitetty {sinceUpdate}s sitten.',
}

type MessageKey = keyof typeof en

const messages: Record<string, Record<MessageKey, string>> = { en, fi }

const detectLocale = (): string => {
  const lang = navigator.language.split('-')[0] ?? 'en'
  return lang in messages ? lang : 'en'
}

const systemLocale = detectLocale()
let locale = systemLocale

export const setLocale = (raw: string | null): void => {
  if (raw === null || raw === '') return
  const normalized = raw.replace(/_/g, '-').split('-')[0]?.toLowerCase()
  if (normalized !== undefined && normalized in messages) locale = normalized
}

export const getLocale = (): string => locale

export const getSystemLocale = (): string => systemLocale

export const availableLocales: ReadonlyArray<string> = Object.keys(messages)

const endonyms: Record<string, string> = {
  en: 'English',
  fi: 'Suomi',
}

export const endonymOf = (code: string): string => endonyms[code] ?? code

let rerenderHook: () => void = () => {}

export const onLocaleChange = (hook: () => void): void => {
  rerenderHook = hook
}

export const changeLanguage = (raw: string): void => {
  setLocale(raw)
  const params = new URLSearchParams(window.location.search)
  params.set('lang', locale)
  history.replaceState(history.state, '', `?${params.toString()}`)
  rerenderHook()
}

export const clearLangOverride = (): void => {
  locale = systemLocale
  const params = new URLSearchParams(window.location.search)
  params.delete('lang')
  const qs = params.toString()
  history.replaceState(
    history.state,
    '',
    qs ? `?${qs}` : window.location.pathname,
  )
  rerenderHook()
}

export const t = (key: MessageKey): string =>
  (messages[locale] ?? en)[key] ?? en[key]

type StatsParams = {
  formulas: number
  rate: string
  tautologies: number
  solved: number
  sinceUpdate: string
}

export const formatStats = (p: StatsParams): string => {
  const values: Record<string, string | number> = {
    formulas: p.formulas,
    rate: p.rate,
    tautologies: p.tautologies,
    solved: p.solved,
    sinceUpdate: p.sinceUpdate,
  }
  return t('statsTemplate').replace(/\{(\w+)\}/g, (_, key) =>
    String(values[key] ?? `{${key}}`),
  )
}
