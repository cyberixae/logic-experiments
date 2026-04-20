export const gameModes = ['random', 'campaign', 'match'] as const
export type GameMode = (typeof gameModes)[number]
