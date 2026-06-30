import type { GameState, TechId, LogEntry } from './state';
import { TECHS } from '../data/techs.data';
import { BUILDINGS } from '../data/buildings.data';
import { JOBS } from '../data/jobs.data';

export function canResearch(tId: TechId, state: GameState): boolean {
  if (state.techs[tId]) return false; // 已研究
  const tech = TECHS[tId];
  // 检查前置
  if (tech.requires) {
    for (const req of tech.requires) {
      if (!state.techs[req]) return false;
    }
  }
  // 检查成本
  for (const [res, cost] of Object.entries(tech.cost)) {
    const amount = state.resources[res as keyof typeof state.resources].amount;
    if (amount < cost) return false;
  }
  return true;
}

export function getAvailableTechs(state: GameState): TechId[] {
  return (Object.keys(TECHS) as TechId[]).filter(id => canResearch(id, state));
}

export function research(tId: TechId, state: GameState): LogEntry {
  const tech = TECHS[tId];
  // 扣费
  for (const [res, cost] of Object.entries(tech.cost)) {
    state.resources[res as keyof typeof state.resources].amount -= cost;
  }
  state.techs[tId] = true;

  // 解锁建筑
  if (tech.unlocksBuildings) {
    for (const bId of tech.unlocksBuildings) {
      state.buildings[bId].unlocked = true;
    }
  }

  return {
    ts: Date.now(),
    type: 'event',
    text: `研习完成：${tech.name}——${tech.description}`,
  };
}
