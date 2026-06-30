import type { GameState } from './state';
import { CURRENT_VERSION } from './state';

import LZString from 'lz-string';

const SAVE_KEY = 'huaxia_save';

export function save(state: GameState): string {
  const json = JSON.stringify(state);
  const compressed = LZString.compressToBase64(json);
  localStorage.setItem(SAVE_KEY, compressed);
  return compressed;
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const json = LZString.decompressFromBase64(raw);
    if (!json) return null;
    let state = JSON.parse(json) as GameState;
    state = migrate(state);
    // 更新 lastTick 为当前时间（防止加载时再次离线结算）
    state.lastTick = Date.now();
    return state;
  } catch {
    return null;
  }
}

export function exportSave(state: GameState): string {
  const json = JSON.stringify(state);
  return LZString.compressToBase64(json);
}

export function importSave(base64: string): GameState | null {
  try {
    if (!base64 || base64.trim() === '') return null;
    const json = LZString.decompressFromBase64(base64.trim());
    if (!json) return null;
    const state = JSON.parse(json) as GameState;
    if (!isValidState(state)) return null;
    return migrate(state);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

function isValidState(s: unknown): s is GameState {
  if (!s || typeof s !== 'object') return false;
  const state = s as Record<string, unknown>;
  return (
    typeof state.version === 'number' &&
    typeof state.lastTick === 'number' &&
    typeof state.resources === 'object' &&
    typeof state.buildings === 'object' &&
    typeof state.techs === 'object' &&
    typeof state.population === 'object' &&
    typeof state.calendar === 'object'
  );
}

// ── Version migration ──
const migrations: Record<number, (s: GameState) => GameState> = {
  // 版本 0→1：初始版本，无需迁移
};

export function migrate(s: GameState): GameState {
  let state: GameState = { ...s, resources: deepClone(s.resources), buildings: deepClone(s.buildings) };
  // 补全缺失的预留字段
  if (!('trade' in state)) (state as any).trade = {};
  if (!('religion' in state)) (state as any).religion = {};
  if (!('paragon' in state)) (state as any).paragon = {};
  if (!('voyage' in state)) (state as any).voyage = {};
  if (!('log' in state)) (state as any).log = [];
  while (state.version < CURRENT_VERSION) {
    const migrator = migrations[state.version];
    if (migrator) {
      state = migrator(state);
    }
    state.version += 1;
  }
  return state;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
