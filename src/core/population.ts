import {
  BASE_MAX_POP,
  GROWTH_PER_SEC,
  SKILL_CAP,
  SKILL_PER_SEC,
  STARVE_INTERVAL,
} from './constants';
import { BUILDINGS } from '../data/buildings.data';
import { randomName } from './names';
import { pushLog } from './log';
import type { GameState, ResourceId, Villager } from './types';

export function maxPop(state: GameState): number {
  let m = BASE_MAX_POP;
  for (const b of BUILDINGS) {
    if (b.maxPop) m += b.maxPop * state.buildings[b.id].count;
  }
  return m;
}

export function newVillager(): Villager {
  return { name: randomName(), job: null, skill: 0 };
}

/** 移除一位百姓：优先白身，其次技艺最低者。返回被移除者。 */
function removeOneVillager(state: GameState): Villager | null {
  const vs = state.population.villagers;
  if (vs.length === 0) return null;
  let idx = vs.findIndex((v) => v.job === null);
  if (idx === -1) {
    idx = 0;
    for (let i = 1; i < vs.length; i++) {
      if (vs[i].skill < vs[idx].skill) idx = i;
    }
  }
  return vs.splice(idx, 1)[0];
}

export function updatePopulation(
  state: GameState,
  dt: number,
  net: Record<ResourceId, number>,
): void {
  const pop = state.population;
  const grain = state.resources.grain.amount;
  const cap = maxPop(state);

  // A. 增长：净产≥0 且 有存粮 且 未满员
  const canGrow = net.grain >= 0 && grain > 0 && pop.villagers.length < cap;
  if (canGrow) {
    pop.growthProgress += GROWTH_PER_SEC * dt;
    if (pop.growthProgress >= 1) {
      pop.growthProgress -= 1;
      const v = newVillager();
      pop.villagers.push(v);
      pushLog(state, 'event', `一户人家迁入了村落：${v.name}`);
    }
  }

  // B. 饥荒：粮尽且净产为负
  if (grain <= 0 && net.grain < 0) {
    state._starveTimer += dt;
    if (state._starveTimer >= STARVE_INTERVAL) {
      state._starveTimer = 0;
      const removed = removeOneVillager(state);
      if (removed) pushLog(state, 'warn', `粮尽！${removed.name} 饿亡流离。`);
    }
  } else {
    state._starveTimer = 0;
  }

  // C. 技艺成长
  if (dt > 0) {
    for (const v of pop.villagers) {
      if (v.job) v.skill = Math.min(SKILL_CAP, v.skill + SKILL_PER_SEC * dt);
    }
  }
}
