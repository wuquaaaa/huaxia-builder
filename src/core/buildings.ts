import { BUILDINGS, BUILDING_MAP } from '../data/buildings.data';
import { pushLog } from './log';
import type { BuildingId, GameState, ResourceId } from './types';

/** 解锁判定：建筑/工役需要的学问已研习则解锁 */
export function recomputeUnlocks(state: GameState): void {
  for (const b of BUILDINGS) {
    if (!b.requiresTech || state.techs[b.requiresTech]) {
      state.buildings[b.id].unlocked = true;
    }
  }
}

/** 当前价格：base * ratio^count */
export function getPrice(state: GameState, id: BuildingId): Partial<Record<ResourceId, number>> {
  const b = BUILDING_MAP[id];
  const cnt = state.buildings[id].count;
  const price: Partial<Record<ResourceId, number>> = {};
  for (const [res, val] of Object.entries(b.prices) as [ResourceId, number][]) {
    price[res] = val * Math.pow(b.priceRatio, cnt);
  }
  return price;
}

export function canAfford(state: GameState, id: BuildingId): boolean {
  const price = getPrice(state, id);
  return (Object.entries(price) as [ResourceId, number][]).every(
    ([res, v]) => state.resources[res].amount >= v,
  );
}

export function build(state: GameState, id: BuildingId): boolean {
  if (!canAfford(state, id)) return false;
  const price = getPrice(state, id);
  for (const [res, v] of Object.entries(price) as [ResourceId, number][]) {
    state.resources[res].amount -= v;
  }
  state.buildings[id].count += 1;
  recomputeUnlocks(state);
  pushLog(state, 'info', `营造了 ${BUILDING_MAP[id].name}`);
  return true;
}
