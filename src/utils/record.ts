export const keys = <K extends string>(s: Record<K, unknown>): Array<K> =>
  Object.keys(s) as Array<K>

export const get = <K extends string, V>(r: Record<K, V>, k: K): V => r[k] as V

export const entries = <K extends string, V>(s: Record<K, V>): Array<[K, V]> =>
  Object.entries(s) as Array<[K, V]>
