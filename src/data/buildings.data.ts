import type { BuildingConfig, BuildingId } from '../core/types';

export const BUILDINGS: BuildingConfig[] = [
  {
    id: 'farmland',
    name: '农田',
    prices: { grain: 10 },
    priceRatio: 1.12,
    produces: { grain: 0.6 },
    affectedBySeason: ['grain'],
    desc: '开垦农田，被动产出粮食，受季节影响。',
  },
  {
    id: 'house',
    name: '民居',
    prices: { wood: 5 },
    priceRatio: 1.15,
    maxPop: 2,
    desc: '每座民居可容纳 2 口人。',
  },
  {
    id: 'academy',
    name: '书院',
    prices: { wood: 25 },
    priceRatio: 1.15,
    produces: { knowledge: 0.1 },
    capBonus: { knowledge: 250 },
    multipliers: [{ target: 'knowledge', factor: 0.1 }],
    desc: '产出学问，并提升学问上限与产量(每座 +10%)。',
  },
  {
    id: 'granary',
    name: '粮仓',
    prices: { wood: 50 },
    priceRatio: 1.75,
    capBonus: { grain: 5000, wood: 200, minerals: 250 },
    desc: '大幅提升粮食、木材、矿石的仓廪上限。',
  },
  {
    id: 'mine',
    name: '矿场',
    prices: { wood: 100 },
    priceRatio: 1.15,
    requiresTech: 'mining',
    multipliers: [{ target: 'miner', factor: 0.2 }],
    desc: '提升矿工产量(每座 +20%)。',
  },
];

export const BUILDING_IDS = BUILDINGS.map((b) => b.id) as BuildingId[];
export const BUILDING_MAP = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
) as Record<BuildingId, BuildingConfig>;
