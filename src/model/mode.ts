export const gameModes = ['random', 'campaign', 'quiz'] as const
export type GameMode = (typeof gameModes)[number]
