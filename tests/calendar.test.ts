import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { advanceCalendar } from '../src/core/calendar';
import { DAY_LENGTH_MS, DAYS_PER_SEASON } from '../src/core/constants';

const SEASON_SECONDS = (DAYS_PER_SEASON * DAY_LENGTH_MS) / 1000; // 一季秒数

describe('历法', () => {
  it('满一季换季', () => {
    const s = createInitialState();
    advanceCalendar(s, SEASON_SECONDS);
    expect(s.calendar.season).toBe(1);
    expect(s.calendar.day).toBe(0);
  });

  it('满四季换年，year+1', () => {
    const s = createInitialState();
    advanceCalendar(s, SEASON_SECONDS * 4);
    expect(s.calendar.season).toBe(0);
    expect(s.calendar.year).toBe(2);
  });

  it('天数推进正确', () => {
    const s = createInitialState();
    advanceCalendar(s, (DAY_LENGTH_MS / 1000) * 10);
    expect(s.calendar.day).toBe(10);
  });
});
