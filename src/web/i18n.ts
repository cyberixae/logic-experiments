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
