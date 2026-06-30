import { DAY_LENGTH_MS, DAYS_PER_SEASON } from './constants';
import { SEASON_NAMES } from '../data/seasons.data';
import { pushLog } from './log';
import type { GameState } from './types';

export function advanceCalendar(state: GameState, dt: number): void {
  const c = state.calendar;
  state._dayProgress += (dt * 1000) / DAY_LENGTH_MS;
  while (state._dayProgress >= 1) {
    state._dayProgress -= 1;
    c.day += 1;
    if (c.day >= DAYS_PER_SEASON) {
      c.day = 0;
      c.season = ((c.season + 1) % 4) as 0 | 1 | 2 | 3;
      if (c.season === 0) {
        c.year += 1;
        pushLog(state, 'event', `新的一年：第 ${c.year} 年`);
      }
      pushLog(state, 'event', `时节更替：${SEASON_NAMES[c.season]}`);
    }
  }
}
