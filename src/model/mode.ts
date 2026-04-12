export const gameModes = ['random', 'campaign'] as const
export type GameMode = (typeof gameModes)[number]
