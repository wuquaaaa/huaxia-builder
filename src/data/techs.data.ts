import type { TechConfig, TechId } from '../core/types';

export const TECHS: TechConfig[] = [
  {
    id: 'calendar',
    name: '历法',
    cost: { knowledge: 30 },
    description: '推演节气，显示季节天数并可预知换季，便于过冬备荒。',
  },
  {
    id: 'farming',
    name: '农耕',
    cost: { knowledge: 100 },
    requires: ['calendar'],
    multipliers: [
      { target: 'farmer', factor: 0.5 },
      { target: 'farmland', factor: 0.5 },
    ],
    description: '农夫与农田产量 +50%。',
  },
  {
    id: 'mining',
    name: '采矿',
    cost: { knowledge: 100 },
    requires: ['calendar'],
    unlocksBuildings: ['mine'],
    unlocksJobs: ['miner'],
    description: '解锁矿工工役与矿场建筑，开启矿石产业链。',
  },
];

export const TECH_IDS = TECHS.map((t) => t.id) as TechId[];
export const TECH_MAP = Object.fromEntries(
  TECHS.map((t) => [t.id, t]),
) as Record<TechId, TechConfig>;
