export const ALL_SYMBOLS = ['p', 'q', 'r', 's'] as const
export const ALL_CONNECTIVE_TYPES = [
  'negation',
  'implication',
  'conjunction',
  'disjunction',
  'falsum',
  'verum',
] as const
export const ALL_VARIABLES = ['A', 'B', 'C', 'D'] as const
export const ALL_SEQUENCES = ['Γ', 'Δ', 'Σ', 'Π'] as const

// URL abbreviations for sequences (capital letters to avoid collision with symbols)
const SEQ_ABBREV: Record<string, string> = { Γ: 'G', Δ: 'D', Σ: 'S', Π: 'P' }

// URL abbreviations for connectives (matches random-config convention)
const CONN_ABBREV: Record<string, string> = {
  implication: 'i',
  conjunction: 'c',
  disjunction: 'd',
  negation: 'n',
  falsum: 'f',
  verum: 'v',
}

export type QuizConfig = {
  symbols: string[]
  connectives: string[]
  variables: string[]
  sequences: string[]
}

export const defaultQuizConfig = (): QuizConfig => ({
  symbols: ['p', 'q', 'r'],
  connectives: ['implication', 'negation'],
  variables: [],
  sequences: [],
})

export const parseQuizConfigFromParams = (
  params: URLSearchParams,
): QuizConfig => {
  const defaults = defaultQuizConfig()
  const symbolsParam = params.get('qsymbols')
  const connectivesParam = params.get('qconnectives')
  const variablesParam = params.get('qvariables')
  const sequencesParam = params.get('qsequences')
  return {
    symbols:
      symbolsParam !== null
        ? ALL_SYMBOLS.filter((s) => symbolsParam.includes(s))
        : defaults.symbols,
    connectives:
      connectivesParam !== null
        ? ALL_CONNECTIVE_TYPES.filter((c) =>
            connectivesParam.includes(CONN_ABBREV[c] ?? ''),
          )
        : defaults.connectives,
    variables:
      variablesParam !== null
        ? ALL_VARIABLES.filter((v) => variablesParam.includes(v))
        : defaults.variables,
    sequences:
      sequencesParam !== null
        ? ALL_SEQUENCES.filter((s) =>
            sequencesParam.includes(SEQ_ABBREV[s] ?? ''),
          )
        : defaults.sequences,
  }
}

export const setQuizConfigParams = (
  config: QuizConfig,
  params: URLSearchParams,
): void => {
  params.set('qsymbols', config.symbols.join(''))
  params.set(
    'qconnectives',
    config.connectives.map((c) => CONN_ABBREV[c] ?? '').join(''),
  )
  params.set('qvariables', config.variables.join(''))
  params.set(
    'qsequences',
    config.sequences.map((s) => SEQ_ABBREV[s] ?? '').join(''),
  )
}
