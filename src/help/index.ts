import * as print from '../render/print'
import * as rk from './rk'

export const helpSystems = {
  rk: {
    id: 'rk',
    name: rk.meta.name,
    meta: rk.meta,
    exampleProof: rk.exampleProof,
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
