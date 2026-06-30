import { RESOURCE_IDS } from '../data/resources.data';
import { advanceCalendar } from './calendar';
import { computeCaps, computeNet } from './resources';
import { updatePopulation } from './population';
import { clamp } from './util';
import type { GameState } from './types';

/** 推进一个 tick（dt 秒）。顺序见详设 §4.2。 */
export function runTick(state: GameState, dt: number): void {
  advanceCalendar(state, dt);
  const caps = computeCaps(state);
  const net = computeNet(state);

  for (const id of RESOURCE_IDS) {
    const next = state.resources[id].amount + net[id] * dt;
    state.resources[id].amount = clamp(next, 0, caps[id]);
  }

  updatePopulation(state, dt, net);
}
