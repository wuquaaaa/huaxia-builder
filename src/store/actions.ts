import type { GameState, JobId, LogEntry } from '../core/state';
import { GATHER_GRAIN_PER_CLICK } from '../core/state';

export function gather(state: GameState): LogEntry[] {
  state.resources.grain.amount += GATHER_GRAIN_PER_CLICK;
  return [];
}

export function setVillagerJob(state: GameState, vIndex: number, job: JobId | null): void {
  if (vIndex < 0 || vIndex >= state.population.villagers.length) return;
  state.population.villagers[vIndex].job = job;
}
