import { BASE_MAX_POP, CURRENT_VERSION } from './constants';
import { RESOURCE_IDS } from '../data/resources.data';
import { BUILDINGS } from '../data/buildings.data';
import { TECH_IDS } from '../data/techs.data';
import type {
  BuildingId,
  BuildingState,
  GameState,
  ResourceId,
  ResourceState,
  TechId,
} from './types';

export { BASE_MAX_POP };

export function createInitialState(): GameState {
  const resources = {} as Record<ResourceId, ResourceState>;
  for (const id of RESOURCE_IDS) resources[id] = { amount: 0 };

  const buildings = {} as Record<BuildingId, BuildingState>;
  for (const b of BUILDINGS) {
    buildings[b.id] = { count: 0, unlocked: !b.requiresTech };
  }

  const techs = {} as Record<TechId, boolean>;
  for (const id of TECH_IDS) techs[id] = false;

  return {
    version: CURRENT_VERSION,
    lastTick: Date.now(),
    resources,
    buildings,
    techs,
    population: { villagers: [], growthProgress: 0 },
    calendar: { day: 0, season: 0, year: 1 },
    log: [],
    _starveTimer: 0,
    _dayProgress: 0,
  };
}
