const en = {
  title: 'LK',
  random: 'Random',
  campaign: 'Campaign',
  menu: 'menu',
  undo: 'undo',
  level: 'level',
  paused: 'Paused',
  resumeGame: 'Resume game',
  resetChallenge: 'Reset challenge',
  freshChallenge: 'Fresh challenge',
  changeSettings: 'Change settings',
  exitToMainMenu: 'Exit to main menu',
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
  bypassPercent: 'Unsolvability (%)',
  targetNonStructural: 'Solution Size',
  start: 'Start',
  back: 'Back',
  preview: 'Preview',
} as const

const fi: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Satunnainen',
  campaign: 'Kampanja',
  menu: 'valikko',
  undo: 'kumoa',
  level: 'taso',
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
  bypassPercent: 'Ratkeamattomuus (%)',
  targetNonStructural: 'Ratkaisun koko',
  start: 'Aloita',
  back: 'Takaisin',
  preview: 'Esikatselu',
}

type MessageKey = keyof typeof en

const messages: Record<string, Record<MessageKey, string>> = { en, fi }

const detectLocale = (): string => {
  const lang = navigator.language.split('-')[0] ?? 'en'
  return lang in messages ? lang : 'en'
}

const locale = detectLocale()

export const t = (key: MessageKey): string =>
  (messages[locale] ?? en)[key] ?? en[key]

type StatsParams = {
  formulas: number
  rate: string
  tautologies: number
  solved: number
  sinceUpdate: string
}

const statsFormatters: Record<string, (p: StatsParams) => string> = {
  en: (p) =>
    `Generated ${p.formulas} formulas (${p.rate}/s), ${p.tautologies} tautologies, ${p.solved} solved. Updated ${p.sinceUpdate}s ago.`,
  fi: (p) =>
    `Tuotettu ${p.formulas} kaavaa (${p.rate}/s), ${p.tautologies} tautologiaa, ${p.solved} ratkaisua. Päivitetty ${p.sinceUpdate}s sitten.`,
}

export const formatStats = (p: StatsParams): string => {
  const fmt = statsFormatters[locale] ?? statsFormatters['en']
  if (!fmt) return ''
  return fmt(p)
}
