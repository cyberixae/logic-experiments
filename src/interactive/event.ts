import { isRev, Rev } from '../systems/lk'

export type Reverse<R extends Rev> = { kind: 'reverse'; rev: R }
export const reverse = <R extends Rev>(rev: R): Reverse<R> => ({
  kind: 'reverse',
  rev,
})

export type Undo = { kind: 'undo' }
export const undo = (): Undo => ({ kind: 'undo' })

export type Reset = { kind: 'reset' }
export const reset = (): Reset => ({ kind: 'reset' })

export type Next = { kind: 'next' }
export const next = (): Next => ({ kind: 'next' })

export type Prev = { kind: 'prev' }
export const prev = (): Prev => ({ kind: 'prev' })

export type Event = Reverse<Rev> | Undo | Reset | Next | Prev

export const parseEvent = (str: string): Event | null => {
  switch (str) {
    case 'next':
      return next()
    case 'prev':
      return prev()
    case 'undo':
      return undo()
    case 'reset':
      return reset()
    default:
      if (isRev(str)) {
        return reverse(str)
      }
  }
  return null
}
