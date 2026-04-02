import { Prop } from '../model/prop'
import { isReverseId0, isReverseId1, ReverseId0, ReverseId1 } from '../rules'
import { split } from '../utils/string'

export type Reverse0<R extends ReverseId0> = { kind: 'reverse0'; rev: R }
export const reverse0 = <R extends ReverseId0>(rev: R): Reverse0<R> => ({
  kind: 'reverse0',
  rev,
})

export type Reverse1<R extends ReverseId1> = {
  kind: 'reverse1'
  rev: R
  a: Prop
}
export const reverse1 = <R extends ReverseId1>(
  rev: R,
  a: Prop,
): Reverse1<R> => ({
  kind: 'reverse1',
  rev,
  a,
})

export type Undo = { kind: 'undo' }
export const undo = (): Undo => ({ kind: 'undo' })

export type Reset = { kind: 'reset' }
export const reset = (): Reset => ({ kind: 'reset' })

export type Level = { kind: 'level' }
export const level = (): Level => ({ kind: 'level' })

export type NextBranch = { kind: 'nextBranch' }
export const nextBranch = (): NextBranch => ({ kind: 'nextBranch' })

export type PrevBranch = { kind: 'prevBranch' }
export const prevBranch = (): PrevBranch => ({ kind: 'prevBranch' })

export type Event =
  | Reverse0<ReverseId0>
  | Reverse1<ReverseId1>
  | Undo
  | Reset
  | Level
  | NextBranch
  | PrevBranch

export const parseEvent = (str: string): Event | null => {
  switch (str) {
    case 'undo':
      return undo()
    case 'reset':
      return reset()
  }
  if (isReverseId0(str)) {
    return reverse0(str)
  }
  const [cmd, ...args] = split(str, ' ')
  if (isReverseId1(cmd)) {
    console.error('TBD, parse:' + JSON.stringify(args))
    //return reverse1(cmd)
  }
  return null
}
