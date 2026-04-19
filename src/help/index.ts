import * as print from '../render/print'
import * as rk from './rk'
import * as fk from './fk'
import * as la3 from './la3'
import * as ttr from './ttr'

export const helpSystems = {
  rk: {
    id: 'rk',
    name: rk.meta.name,
    meta: rk.meta,
    exampleProof: rk.exampleProof,
  },
  fk: {
    id: 'fk',
    name: fk.meta.name,
    meta: fk.meta,
    exampleProof: fk.exampleProof,
  },
  la3: {
    id: 'la3',
    name: la3.meta.name,
    meta: la3.meta,
    exampleProof: la3.exampleProof,
  },
  ttr: {
    id: 'ttr',
    name: ttr.meta.name,
    meta: ttr.meta,
    exampleProof: ttr.exampleProof,
  },
} as const

export type HelpSystemId = keyof typeof helpSystems

export const isHelpSystemId = (s: string): s is HelpSystemId => s in helpSystems

export const renderSystemHelp = (id: HelpSystemId): string => {
  const sys = helpSystems[id]
  return (
    print.fromMeta(sys.meta) +
    '\n\nSandbox\n\n' +
    print.fromDerivation(sys.exampleProof) +
    '\n'
  )
}
