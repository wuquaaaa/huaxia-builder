import type { GameState, LogEntry } from './state';
import { computeNet, computeCaps } from './resources';

export function applyOfflineProgress(state: GameState): LogEntry | null {
  const now = Date.now();
  const gapSec = (now - state.lastTick) / 1000;

  if (gapSec <= 1) return null; // 离线不到 1 秒，跳过

  const hours = gapSec / 3600;
  const net = computeNet(state);
  const caps = computeCaps(state);

  // 快速近似：按当前净产 × 离线时长
  const summary: string[] = [];
  for (const [res, rate] of Object.entries(net)) {
    const rId = res as keyof typeof state.resources;
    const oldAmount = state.resources[rId].amount;
    const delta = rate * gapSec;
    const newAmount = Math.max(0, Math.min(oldAmount + delta, caps[rId] ?? Infinity));
    state.resources[rId].amount = newAmount;
    if (Math.abs(newAmount - oldAmount) > 0.1) {
      const sign = newAmount > oldAmount ? '+' : '';
      summary.push(`${state.resources[rId] as unknown as { amount: number } !== undefined ? '' : ''}${sign}${(newAmount - oldAmount).toFixed(1)}`);
    }
  }

  const durText = hours >= 1
    ? `${hours.toFixed(1)} 小时`
    : `${Math.floor(gapSec / 60)} 分钟`;

  return {
    ts: now,
    type: 'info',
    text: `你离开了 ${durText}，村落在此期间累计了资源。`,
  };
}
