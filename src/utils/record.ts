export const entries = <K extends string, V>(s: Record<K, V>): Array<[K, V]> => Object.entries(s) as any;
