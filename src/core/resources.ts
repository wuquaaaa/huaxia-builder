import type { GameState, ResourceId, JobId } from './state';
import { SKILL_MAX_BONUS, VILLAGER_GRAIN_PER_SEC } from './state';
import { RESOURCES } from '../data/resources.data';
import { BUILDINGS } from '../data/buildings.data';
import { JOBS } from '../data/jobs.data';
import { SEASONS } from '../data/seasons.data';
import { TECHS } from '../data/techs.data';

export function computeCaps(state: GameState): Record<ResourceId, number> {
  const caps: Record<string, number> = {};
  for (const rId of Object.keys(RESOURCES) as ResourceId[]) {
    let cap = RESOURCES[rId].baseCap;
    for (const bId of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
      const b = BUILDINGS[bId];
      const count = state.buildings[bId].count;
      if (b.capBonus?.[rId]) {
        cap += b.capBonus[rId]! * count;
      }
    }
    caps[rId] = Math.max(0, cap);
  }
  return caps;
}

export function computeNet(state: GameState): Record<ResourceId, number> {
  const net: Record<string, number> = {};
  const resIds = Object.keys(RESOURCES) as ResourceId[];
  for (const r of resIds) net[r] = 0;

  const season = SEASONS[state.calendar.season];

  // 建筑被动产出
  for (const bId of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    const bConf = BUILDINGS[bId];
    const count = state.buildings[bId].count;
    if (count <= 0 || !bConf.produces) continue;
    for (const rId of resIds) {
      const base = bConf.produces[rId];
      if (base === undefined) continue;
      let mul = 1;
      if (bConf.affectedBySeason?.includes(rId)) {
        mul *= season.grainMul;
      }
      net[rId]! += base * count * mul;
    }
  }

  // 工役产出
  for (const v of state.population.villagers) {
    if (!v.job) continue;
    const jConf = JOBS[v.job];
    // 检查工役是否已解锁
    if (jConf.requiresTech && !state.techs[jConf.requiresTech]) continue;
    for (const rId of resIds) {
      const base = jConf.produces[rId];
      if (base === undefined) continue;

      // 技艺加成（加法，上限 +100%）
      const skillMul = 1 + Math.min(v.skill, 1) * SKILL_MAX_BONUS;

      // 季节
      let seasonMul = 1;
      if (jConf.affectedBySeason?.includes(rId)) {
        seasonMul = season.grainMul;
      }

      // 科技加成
      let techMul = 1;
      if (rId === 'grain' && state.techs.farming) {
        // 农耕：农夫 +50%
        if (v.job === 'farmer') techMul = 1.5;
      }

      // 建筑乘算（加法叠加）
      const buildMul = getMultiplier(v.job, state);

      const contribution = base * skillMul * seasonMul * techMul * buildMul;
      net[rId]! += contribution;
    }
  }

  // 农耕科技对农田被动产出的额外加成（耕农田+50%）
  if (state.techs.farming) {
    const farmland = state.buildings.farmland;
    if (farmland.count > 0) {
      const base = BUILDINGS.farmland.produces!.grain! * farmland.count;
      const addMul = season.grainMul * 1.5 - season.grainMul; // 增量部分
      net.grain! += base * (addMul / season.grainMul) * 0.5;
    }
  }

  // 百姓粮食消耗
  const grainConsumption = state.population.villagers.length * VILLAGER_GRAIN_PER_SEC;
  net.grain! -= grainConsumption;

  return net;
}

export function getMultiplier(target: ResourceId | JobId, state: GameState): number {
  let total = 1;
  for (const bId of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    const b = BUILDINGS[bId];
    const count = state.buildings[bId].count;
    if (count <= 0 || !b.multipliers) continue;
    if (b.multipliers.target === target) {
      total += b.multipliers.factor * count;
    }
  }
  return total;
}
