import { VILLAGER_GRAIN_PER_SEC, SKILL_CAP, SKILL_MAX_BONUS } from './constants';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.data';
import { BUILDINGS } from '../data/buildings.data';
import { JOB_MAP } from '../data/jobs.data';
import { TECHS } from '../data/techs.data';
import { SEASON_GRAIN_MUL } from '../data/seasons.data';
import type { GameState, MultiplierTarget, ResourceId } from './types';

/** 季节对某资源的产量乘子（目前仅粮食受影响） */
export function seasonMulFor(res: ResourceId, state: GameState): number {
  if (res === 'grain') return SEASON_GRAIN_MUL[state.calendar.season];
  return 1;
}

/**
 * 统一乘算入口：遍历建筑与已研习学问，收集 target 匹配的 factor。
 * 加法叠加：1 + Σ(factor * count)（建筑按数量，学问按 1 次）。
 */
export function getMultiplier(target: MultiplierTarget, state: GameState): number {
  let m = 1;
  for (const b of BUILDINGS) {
    const cnt = state.buildings[b.id].count;
    if (!cnt || !b.multipliers) continue;
    for (const mul of b.multipliers) {
      if (mul.target === target) m += mul.factor * cnt;
    }
  }
  for (const t of TECHS) {
    if (!state.techs[t.id] || !t.multipliers) continue;
    for (const mul of t.multipliers) {
      if (mul.target === target) m += mul.factor;
    }
  }
  return m;
}

/** 各资源仓廪上限（派生值，每帧计算） */
export function computeCaps(state: GameState): Record<ResourceId, number> {
  const caps = {} as Record<ResourceId, number>;
  for (const r of RESOURCES) caps[r.id] = r.baseCap;
  for (const b of BUILDINGS) {
    const cnt = state.buildings[b.id].count;
    if (!cnt || !b.capBonus) continue;
    for (const [res, val] of Object.entries(b.capBonus) as [ResourceId, number][]) {
      caps[res] += val * cnt;
    }
  }
  return caps;
}

/** 各资源每秒净产出（含建筑被动、工役产出、百姓消耗与所有乘算修正） */
export function computeNet(state: GameState): Record<ResourceId, number> {
  const net = {} as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) net[id] = 0;

  // 建筑被动产出
  for (const b of BUILDINGS) {
    const cnt = state.buildings[b.id].count;
    if (!cnt || !b.produces) continue;
    for (const [resStr, val] of Object.entries(b.produces) as [ResourceId, number][]) {
      const res = resStr;
      const sMul = b.affectedBySeason?.includes(res) ? seasonMulFor(res, state) : 1;
      net[res] += val * cnt * sMul * getMultiplier(b.id, state) * getMultiplier(res, state);
    }
  }

  // 工役产出
  for (const v of state.population.villagers) {
    if (!v.job) continue;
    const job = JOB_MAP[v.job];
    const skillMul = 1 + Math.min(v.skill, SKILL_CAP) * SKILL_MAX_BONUS;
    for (const [resStr, val] of Object.entries(job.produces) as [ResourceId, number][]) {
      const res = resStr;
      const sMul = job.affectedBySeason?.includes(res) ? seasonMulFor(res, state) : 1;
      net[res] += val * skillMul * sMul * getMultiplier(job.id, state) * getMultiplier(res, state);
    }
  }

  // 百姓消耗粮食
  net.grain -= state.population.villagers.length * VILLAGER_GRAIN_PER_SEC;

  return net;
}
