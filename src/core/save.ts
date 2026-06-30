import LZString from 'lz-string';
import { CURRENT_VERSION, SAVE_KEY } from './constants';
import { RESOURCE_IDS } from '../data/resources.data';
import { BUILDINGS } from '../data/buildings.data';
import { TECH_IDS } from '../data/techs.data';
import { recomputeUnlocks } from './buildings';
import { createInitialState } from './state';
import type { GameState } from './types';

/** 版本迁移 + 字段补全，保证旧存档结构完整 */
export function migrate(raw: any): GameState {
  const init = createInitialState();
  const s: GameState = { ...init, ...raw };

  s.version = CURRENT_VERSION;

  s.resources = { ...init.resources, ...(raw?.resources ?? {}) };
  for (const id of RESOURCE_IDS) {
    if (!s.resources[id]) s.resources[id] = { amount: 0 };
  }

  s.buildings = { ...init.buildings, ...(raw?.buildings ?? {}) };
  for (const b of BUILDINGS) {
    if (!s.buildings[b.id]) s.buildings[b.id] = { count: 0, unlocked: !b.requiresTech };
  }

  s.techs = { ...init.techs, ...(raw?.techs ?? {}) };
  for (const id of TECH_IDS) {
    if (s.techs[id] === undefined) s.techs[id] = false;
  }

  if (!s.population || !Array.isArray(s.population.villagers)) {
    s.population = { villagers: [], growthProgress: 0 };
  }
  if (!s.calendar) s.calendar = init.calendar;
  if (!Array.isArray(s.log)) s.log = [];
  if (typeof s._starveTimer !== 'number') s._starveTimer = 0;
  if (typeof s._dayProgress !== 'number') s._dayProgress = 0;
  if (typeof s.lastTick !== 'number') s.lastTick = Date.now();

  recomputeUnlocks(s);
  return s;
}

export function serialize(state: GameState): string {
  return LZString.compressToBase64(JSON.stringify(state));
}

export function deserialize(str: string): GameState | null {
  const json = LZString.decompressFromBase64(str);
  if (!json) return null;
  try {
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
  } catch {
    /* localStorage 不可用时静默忽略 */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
