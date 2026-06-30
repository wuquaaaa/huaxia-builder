import type { BuildingId, BuildingConfig } from '../core/state';

export const BUILDINGS: Record<BuildingId, BuildingConfig> = {
  farmland: {
    id: 'farmland',
    name: '农田',
    prices: { grain: 10 },
    priceRatio: 1.12,
    produces: { grain: 0.6 },
    affectedBySeason: ['grain'],
    requiresTech: undefined,
  },
  house: {
    id: 'house',
    name: '民居',
    prices: { wood: 5 },
    priceRatio: 1.15,
    maxPop: 2,
    requiresTech: undefined,
  },
  academy: {
    id: 'academy',
    name: '书院',
    prices: { wood: 25 },
    priceRatio: 1.15,
    produces: { knowledge: 0.1 },
    capBonus: { knowledge: 250 },
    multipliers: { target: 'knowledge', factor: 0.1 },
    requiresTech: undefined,
  },
  granary: {
    id: 'granary',
    name: '粮仓',
    prices: { wood: 50 },
    priceRatio: 1.75,
    capBonus: { grain: 5000, wood: 200, minerals: 250 },
    requiresTech: undefined,
  },
  mine: {
    id: 'mine',
    name: '矿场',
    prices: { wood: 100 },
    priceRatio: 1.15,
    multipliers: { target: 'miner', factor: 0.2 },
    requiresTech: 'mining',
  },
};
