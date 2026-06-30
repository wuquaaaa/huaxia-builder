import { RESOURCE_IDS } from '../data/resources.data';
import { computeCaps, computeNet } from './resources';
import { clamp } from './util';
import type { GameState, ResourceId } from './types';

export interface OfflineResult {
  gapSec: number;
  gained: Record<ResourceId, number>;
}

/**
 * 离线快速近似结算（详设 §4.8）：不跑真实 tick，
 * 直接以当前净产 × 离线时长外推，不设上限。
 * 忽略离线期间的季节切换与人口变化。
 */
export function settleOffline(state: GameState): OfflineResult | null {
  const gapSec = (Date.now() - state.lastTick) / 1000;
  if (gapSec <= 0.5) {
    state.lastTick = Date.now();
    return null;
  }

  const caps = computeCaps(state);
  const net = computeNet(state);
  const gained = {} as Record<ResourceId, number>;

  for (const id of RESOURCE_IDS) {
    const before = state.resources[id].amount;
    const after = clamp(before + net[id] * gapSec, 0, caps[id]);
    gained[id] = after - before;
    state.resources[id].amount = after;
  }

  state.lastTick = Date.now();
  return { gapSec, gained };
}
