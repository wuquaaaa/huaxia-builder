import {
  AUTOSAVE_INTERVAL_MS,
  EMIT_THROTTLE_MS,
  GATHER_GRAIN_PER_CLICK,
  TICKS_PER_SECOND,
  TICK_MS,
} from '../core/constants';
import { createInitialState } from '../core/state';
import { runTick } from '../core/engine';
import { build as buildCore } from '../core/buildings';
import { research as researchCore } from '../core/tech';
import { computeCaps } from '../core/resources';
import { newVillager } from '../core/population';
import { settleOffline } from '../core/offline';
import { loadGame, saveGame, clearSave, serialize, deserialize } from '../core/save';
import { pushLog } from '../core/log';
import { clamp, formatDuration, fmt } from '../core/util';
import { RESOURCE_MAP } from '../data/resources.data';
import type { BuildingId, GameState, JobId, TechId } from '../core/types';

// ---- 单一全局状态 ----
let state: GameState = loadGame() ?? createInitialState();

// 离线结算（仅对已有进度的存档有意义）
const offline = settleOffline(state);
if (offline) {
  const parts = (Object.keys(offline.gained) as (keyof typeof offline.gained)[])
    .filter((k) => Math.abs(offline.gained[k]) >= 0.1)
    .map((k) => `${RESOURCE_MAP[k].name} ${offline.gained[k] >= 0 ? '+' : ''}${fmt(offline.gained[k])}`);
  pushLog(
    state,
    'event',
    `你离开了 ${formatDuration(offline.gapSec)}，村落收获：${parts.length ? parts.join('，') : '无明显变化'}`,
  );
}

// ---- 订阅机制（useSyncExternalStore） ----
const listeners = new Set<() => void>();
let version = 0;
let lastEmit = 0;

function notify(): void {
  version++;
  listeners.forEach((l) => l());
}

/** tick 循环产生的变更：节流通知，避免每帧重渲染 */
function emitThrottled(): void {
  const now = performance.now();
  if (now - lastEmit < EMIT_THROTTLE_MS) return;
  lastEmit = now;
  notify();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getVersion(): number {
  return version;
}

export function getState(): GameState {
  return state;
}

// ---- 游戏主循环 ----
let rafId = 0;
function frame(): void {
  const now = Date.now();
  const elapsed = now - state.lastTick;
  const ticks = Math.floor(elapsed / TICK_MS);
  if (ticks > 0) {
    for (let i = 0; i < ticks; i++) runTick(state, 1 / TICKS_PER_SECOND);
    state.lastTick += ticks * TICK_MS;
    emitThrottled();
  }
  rafId = requestAnimationFrame(frame);
}

export function startLoop(): void {
  if (rafId) return;
  rafId = requestAnimationFrame(frame);

  // 自动存档
  setInterval(() => saveGame(state), AUTOSAVE_INTERVAL_MS);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveGame(state);
    });
    window.addEventListener('beforeunload', () => saveGame(state));
  }
}

// ---- 玩家动作（动作后立即 notify 以保证 UI 即时响应） ----
export function gather(): void {
  const cap = computeCaps(state).grain;
  state.resources.grain.amount = clamp(
    state.resources.grain.amount + GATHER_GRAIN_PER_CLICK,
    0,
    cap,
  );
  notify();
}

export function doBuild(id: BuildingId): void {
  if (buildCore(state, id)) notify();
}

export function doResearch(id: TechId): void {
  if (researchCore(state, id)) notify();
}

/** 把一位白身百姓指派到某工役 */
export function assignJob(job: JobId): void {
  const idle = state.population.villagers.find((v) => v.job === null);
  if (!idle) return;
  idle.job = job;
  notify();
}

/** 从某工役撤回一位百姓（变回白身） */
export function unassignJob(job: JobId): void {
  // 撤回技艺最低者，保留熟练工
  const workers = state.population.villagers.filter((v) => v.job === job);
  if (workers.length === 0) return;
  let lowest = workers[0];
  for (const w of workers) if (w.skill < lowest.skill) lowest = w;
  lowest.job = null;
  notify();
}

export function jobCount(job: JobId): number {
  return state.population.villagers.filter((v) => v.job === job).length;
}

export function idleCount(): number {
  return state.population.villagers.filter((v) => v.job === null).length;
}

// ---- 存档导入/导出/重置 ----
export function exportSave(): string {
  return serialize(state);
}

export function importSave(str: string): boolean {
  const loaded = deserialize(str.trim());
  if (!loaded) return false;
  state = loaded;
  saveGame(state);
  notify();
  return true;
}

export function resetGame(): void {
  clearSave();
  state = createInitialState();
  pushLog(state, 'info', '开创新朝，一切从头开始。');
  notify();
}

// 调试用：加一位百姓（不在正式 UI 暴露）
export function _debugAddVillager(): void {
  state.population.villagers.push(newVillager());
  notify();
}
