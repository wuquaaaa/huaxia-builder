import { TECH_MAP } from '../data/techs.data';
import { recomputeUnlocks } from './buildings';
import { pushLog } from './log';
import type { GameState, ResourceId, TechId } from './types';

export function canResearch(state: GameState, id: TechId): boolean {
  if (state.techs[id]) return false;
  const t = TECH_MAP[id];
  if (t.requires && !t.requires.every((r) => state.techs[r])) return false;
  return (Object.entries(t.cost) as [ResourceId, number][]).every(
    ([res, v]) => state.resources[res].amount >= v,
  );
}

/** 前置已满足、但资源不一定够（用于 UI 是否显示该学问） */
export function isVisible(state: GameState, id: TechId): boolean {
  if (state.techs[id]) return false;
  const t = TECH_MAP[id];
  if (t.requires && !t.requires.every((r) => state.techs[r])) return false;
  return true;
}

export function research(state: GameState, id: TechId): boolean {
  if (!canResearch(state, id)) return false;
  const t = TECH_MAP[id];
  for (const [res, v] of Object.entries(t.cost) as [ResourceId, number][]) {
    state.resources[res].amount -= v;
  }
  state.techs[id] = true;
  recomputeUnlocks(state);
  pushLog(state, 'event', `习得新学问：${t.name}`);
  return true;
}
