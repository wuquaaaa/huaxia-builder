import type { GameState, LogEntry } from './state';
import { SEASONS, DAYS_PER_SEASON, DAY_LENGTH_MS, type SeasonId } from '../data/seasons.data';

export function advanceCalendar(state: GameState, dt: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const cal = state.calendar;

  // dt 是秒，转换为游戏天数
  const dayFrac = dt * (1000 / DAY_LENGTH_MS);
  cal.day += dayFrac;

  while (cal.day >= DAYS_PER_SEASON) {
    cal.day -= DAYS_PER_SEASON;
    cal.season = ((cal.season + 1) % 4) as SeasonId;
    if (cal.season === 0) {
      cal.year += 1;
      logs.push({ ts: Date.now(), type: 'event', text: `新的一年：第 ${cal.year} 年` });
    }
    logs.push({ ts: Date.now(), type: 'info', text: `时节更替：${SEASONS[cal.season].name}（粮食倍率 ×${SEASONS[cal.season].grainMul}）` });
  }

  return logs;
}
