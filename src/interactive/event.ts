import { Rev } from '../lk'

export type Reverse<R extends Rev> = { kind: 'reverse'; rev: R }
export const reverse = <R extends Rev>(rev: R): Reverse<R> => ({
  kind: 'reverse',
  rev,
})

export type Undo = { kind: 'undo' }
export const undo = (): Undo => ({ kind: 'undo' })

export type Next = { kind: 'next' }
export const next = (): Next => ({ kind: 'next' })

export type Prev = { kind: 'prev' }
export const prev = (): Prev => ({ kind: 'prev' })

export type Event = Reverse<Rev> | Undo | Next | Prev
