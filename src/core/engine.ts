import type { GameState } from './state';
import { TICKS_PER_SECOND, LOG_MAX } from './state';
import { computeNet, computeCaps } from './resources';
import { advanceCalendar } from './calendar';
import { updatePopulation } from './population';

const DT = 1 / TICKS_PER_SECOND;

export function runTick(state: GameState): void {
  // 1. 推进历法
  const calLogs = advanceCalendar(state, DT);
  state.log.push(...calLogs);

  // 2. 计算 caps
  const caps = computeCaps(state);

  // 3. 计算净产出
  const net = computeNet(state);

  // 4. 应用产出
  for (const [res, rate] of Object.entries(net)) {
    const rKey = res as keyof typeof state.resources;
    const delta = rate * DT;
    const newAmount = state.resources[rKey].amount + delta;
    state.resources[rKey].amount = Math.max(0, Math.min(newAmount, caps[rKey] ?? Infinity));
  }

  // 5. 人口结算
  const popLogs = updatePopulation(state, DT, net.grain ?? 0);
  state.log.push(...popLogs);

  // 裁剪日志
  if (state.log.length > LOG_MAX) {
    state.log = state.log.slice(-LOG_MAX);
  }
}

export function runTicks(state: GameState, elapsedMs: number): void {
  const tickMs = 1000 / TICKS_PER_SECOND;
  const ticksToRun = Math.floor(elapsedMs / tickMs);
  for (let i = 0; i < ticksToRun; i++) {
    runTick(state);
  }
  state.lastTick += ticksToRun * tickMs;
}
