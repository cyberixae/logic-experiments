export const ALL_SYMBOLS = ['p', 'q', 'r', 's', 'u', 'v'] as const
export const ALL_INSTANCE_SYMBOLS = ALL_SYMBOLS
export const ALL_CONNECTIVE_TYPES = [
  'implication',
  'conjunction',
  'disjunction',
  'negation',
  'falsum',
  'verum',
] as const
export const ALL_VARIABLES = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export const ALL_SEQUENCES = ['Γ', 'Δ', 'Σ', 'Π', 'Ξ', 'Ψ'] as const

// URL abbreviations for sequences (capital letters to avoid collision with symbols)
const SEQ_ABBREV: Record<string, string> = {
  Γ: 'G',
  Δ: 'D',
  Σ: 'S',
  Π: 'P',
  Ξ: 'X',
  Ψ: 'Y',
}

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
  formulaSize: number
  premiseCounts: number[]
  contextSize: number
  instanceFormulaSize: number
  instanceSequenceSize: number
  instanceConnectives: string[]
  instanceSymbols: string[]
}

const A = <T extends readonly unknown[]>(arr: T): T[number][] => [...arr]

export const PRESETS: readonly QuizConfig[] = [
  // 0: pure symbol matching
  {
    symbols: A(ALL_SYMBOLS),
    connectives: [],
    variables: [],
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: [],
    instanceSymbols: [],
  },
  // 1: symbols + connectives, no variables
  {
    symbols: A(ALL_SYMBOLS),
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: [],
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: [],
    instanceSymbols: [],
  },
  // 2: symbols + connectives + variables, inst symbols
  {
    symbols: A(ALL_SYMBOLS),
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: A(ALL_VARIABLES),
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: [],
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 3: connectives + variables, no symbols
  {
    symbols: [],
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: A(ALL_VARIABLES),
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: [],
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 4: variables only, inst connectives
  {
    symbols: [],
    connectives: [],
    variables: A(ALL_VARIABLES),
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: A(ALL_CONNECTIVE_TYPES),
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 5: connectives + variables, inst connectives
  {
    symbols: [],
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: A(ALL_VARIABLES),
    sequences: [],
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: A(ALL_CONNECTIVE_TYPES),
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 6: variables + sequences, short inst seq
  {
    symbols: [],
    connectives: [],
    variables: A(ALL_VARIABLES),
    sequences: A(ALL_SEQUENCES),
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 1,
    instanceConnectives: [],
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 7: variables + sequences, longer inst seq
  {
    symbols: [],
    connectives: [],
    variables: A(ALL_VARIABLES),
    sequences: A(ALL_SEQUENCES),
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 3,
    instanceConnectives: [],
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 8: connectives + variables + sequences, inst connectives
  {
    symbols: [],
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: A(ALL_VARIABLES),
    sequences: A(ALL_SEQUENCES),
    formulaSize: 1,
    premiseCounts: [0, 1, 2],
    contextSize: 2,
    instanceFormulaSize: 1,
    instanceSequenceSize: 2,
    instanceConnectives: A(ALL_CONNECTIVE_TYPES),
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
  // 9: full, larger formulas
  {
    symbols: [],
    connectives: A(ALL_CONNECTIVE_TYPES),
    variables: A(ALL_VARIABLES),
    sequences: A(ALL_SEQUENCES),
    formulaSize: 2,
    premiseCounts: [0, 1, 2],
    contextSize: 3,
    instanceFormulaSize: 2,
    instanceSequenceSize: 3,
    instanceConnectives: A(ALL_CONNECTIVE_TYPES),
    instanceSymbols: A(ALL_INSTANCE_SYMBOLS),
  },
]

const sortedJoin = (arr: string[]): string => [...arr].sort().join(',')

export const matchPreset = (config: QuizConfig): number | null => {
  for (let i = 0; i < PRESETS.length; i += 1) {
    const p = PRESETS[i]
    if (p === undefined) continue
    if (
      sortedJoin(config.symbols) === sortedJoin(p.symbols) &&
      sortedJoin(config.connectives) === sortedJoin(p.connectives) &&
      sortedJoin(config.variables) === sortedJoin(p.variables) &&
      sortedJoin(config.sequences) === sortedJoin(p.sequences) &&
      config.formulaSize === p.formulaSize &&
      sortedJoin(config.premiseCounts.map(String)) ===
        sortedJoin(p.premiseCounts.map(String)) &&
      config.contextSize === p.contextSize &&
      config.instanceFormulaSize === p.instanceFormulaSize &&
      config.instanceSequenceSize === p.instanceSequenceSize &&
      sortedJoin(config.instanceConnectives) ===
        sortedJoin(p.instanceConnectives) &&
      sortedJoin(config.instanceSymbols) === sortedJoin(p.instanceSymbols)
    )
      return i
  }
  return null
}

export const defaultQuizConfig = (): QuizConfig => ({
  symbols: [],
  connectives: [...ALL_CONNECTIVE_TYPES],
  variables: [...ALL_VARIABLES],
  sequences: [...ALL_SEQUENCES],
  formulaSize: 1,
  premiseCounts: [1],
  contextSize: 2,
  instanceFormulaSize: 2,
  instanceSequenceSize: 2,
  instanceConnectives: [...ALL_CONNECTIVE_TYPES],
  instanceSymbols: [...ALL_INSTANCE_SYMBOLS],
})

export const parseQuizConfigFromParams = (
  params: URLSearchParams,
): QuizConfig => {
  const defaults = defaultQuizConfig()
  const symbolsParam = params.get('qsymbols')
  const connectivesParam = params.get('qconnectives')
  const variablesParam = params.get('qvariables')
  const sequencesParam = params.get('qsequences')
  const sizeParam = params.get('qsize')
  const premisesParam = params.get('qpremises')
  const contextParam = params.get('qcontext')
  const instSizeParam = params.get('qinstsize')
  const instSeqSizeParam = params.get('qinstseq')
  const instConnParam = params.get('qinstconn')
  const instSymParam = params.get('qinstsym')
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
    formulaSize:
      sizeParam !== null
        ? Math.max(
            0,
            Math.min(10, parseInt(sizeParam, 10) || defaults.formulaSize),
          )
        : defaults.formulaSize,
    premiseCounts:
      premisesParam !== null
        ? [0, 1, 2].filter((n) => premisesParam.includes(String(n)))
        : defaults.premiseCounts,
    contextSize:
      contextParam !== null
        ? Math.max(
            0,
            Math.min(6, parseInt(contextParam, 10) || defaults.contextSize),
          )
        : defaults.contextSize,
    instanceFormulaSize:
      instSizeParam !== null
        ? Math.max(
            0,
            Math.min(
              10,
              parseInt(instSizeParam, 10) || defaults.instanceFormulaSize,
            ),
          )
        : defaults.instanceFormulaSize,
    instanceSequenceSize:
      instSeqSizeParam !== null
        ? Math.max(
            0,
            Math.min(
              6,
              parseInt(instSeqSizeParam, 10) || defaults.instanceSequenceSize,
            ),
          )
        : defaults.instanceSequenceSize,
    instanceConnectives:
      instConnParam !== null
        ? ALL_CONNECTIVE_TYPES.filter((c) =>
            instConnParam.includes(CONN_ABBREV[c] ?? ''),
          )
        : defaults.instanceConnectives,
    instanceSymbols:
      instSymParam !== null
        ? ALL_INSTANCE_SYMBOLS.filter((s) => instSymParam.includes(s))
        : defaults.instanceSymbols,
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
  params.set('qsize', String(config.formulaSize))
  params.set('qpremises', config.premiseCounts.join(''))
  params.set('qcontext', String(config.contextSize))
  params.set('qinstsize', String(config.instanceFormulaSize))
  params.set('qinstseq', String(config.instanceSequenceSize))
  params.set(
    'qinstconn',
    config.instanceConnectives.map((c) => CONN_ABBREV[c] ?? '').join(''),
  )
  params.set('qinstsym', config.instanceSymbols.join(''))
}
