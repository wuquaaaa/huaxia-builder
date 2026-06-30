export type SeasonId = 0 | 1 | 2 | 3;

export interface SeasonConfig {
  name: string;
  grainMul: number;
}

export const SEASONS: Record<SeasonId, SeasonConfig> = {
  0: { name: '春', grainMul: 1.5 },
  1: { name: '夏', grainMul: 1.0 },
  2: { name: '秋', grainMul: 1.0 },
  3: { name: '冬', grainMul: 0.25 },
};

export const DAYS_PER_SEASON = 100;
export const DAY_LENGTH_MS = 2000; // 2 real seconds per in-game day
