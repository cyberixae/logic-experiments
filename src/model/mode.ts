export const gameModes = ['random', 'campaign', 'tutorial'] as const
export type GameMode = (typeof gameModes)[number]
