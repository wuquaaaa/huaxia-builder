import type { GameState, BuildingId, LogEntry } from './state';
import { BUILDINGS } from '../data/buildings.data';

export function getPrice(bId: BuildingId, state: GameState): Record<string, number> {
  const conf = BUILDINGS[bId];
  const count = state.buildings[bId].count;
  const price: Record<string, number> = {};
  for (const [res, base] of Object.entries(conf.prices)) {
    price[res] = Math.floor(base * Math.pow(conf.priceRatio, count));
  }
  return price;
}

export function canAfford(bId: BuildingId, state: GameState): boolean {
  const price = getPrice(bId, state);
  for (const [res, cost] of Object.entries(price)) {
    if (state.resources[res as keyof typeof state.resources].amount < cost) return false;
  }
  return true;
}

export function canAffordN(bId: BuildingId, n: number, state: GameState): number {
  // 返回最大可建数量（0 ~ n）
  let affordable = 0;
  // 临时状态模拟
  const tempResources: Record<string, number> = {};
  for (const key of Object.keys(state.resources)) {
    tempResources[key] = state.resources[key as keyof typeof state.resources].amount;
  }
  for (let i = 0; i < n; i++) {
    const price = getPriceNth(bId, state.buildings[bId].count + i);
    let ok = true;
    for (const [res, cost] of Object.entries(price)) {
      if ((tempResources[res] ?? 0) < cost) { ok = false; break; }
    }
    if (!ok) break;
    for (const [res, cost] of Object.entries(price)) {
      tempResources[res] -= cost;
    }
    affordable++;
  }
  return affordable;
}

function getPriceNth(bId: BuildingId, nth: number): Record<string, number> {
  const conf = BUILDINGS[bId];
  const price: Record<string, number> = {};
  for (const [res, base] of Object.entries(conf.prices)) {
    price[res] = Math.floor(base * Math.pow(conf.priceRatio, nth));
  }
  return price;
}

export function build(bId: BuildingId, count: number, state: GameState): LogEntry[] {
  const logs: LogEntry[] = [];
  const conf = BUILDINGS[bId];
  for (let i = 0; i < count; i++) {
    const price = getPrice(bId, state);
    for (const [res, cost] of Object.entries(price)) {
      state.resources[res as keyof typeof state.resources].amount -= cost;
    }
    state.buildings[bId].count += 1;
    logs.push({ ts: Date.now(), type: 'info', text: `营造了 ${conf.name}（第 ${state.buildings[bId].count} 座）` });
  }
  // 建筑完成时重新计算解锁
  recomputeUnlocks(state);
  return logs;
}

export function recomputeUnlocks(state: GameState): void {
  // 矿场：采矿学问解锁
  state.buildings.mine.unlocked = state.techs.mining;
  // 后续可扩展更多条件解锁
}

// 批量营造：×10、×max
export function getBuildOptions(bId: BuildingId, state: GameState) {
  return {
    single: canAfford(bId, state),
    max: canAffordN(bId, 999, state),
  };
}
