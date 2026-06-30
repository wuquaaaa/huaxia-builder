import { useGame } from './useGame';
import { computeCaps, computeNet } from '../core/resources';
import { RESOURCES } from '../data/resources.data';
import { SEASON_ICONS, SEASON_NAMES } from '../data/seasons.data';
import { DAYS_PER_SEASON } from '../core/constants';
import { fmt, fmtSigned } from '../core/util';
import { maxPop } from '../core/population';

export function ResourceBar() {
  const state = useGame();
  const caps = computeCaps(state);
  const net = computeNet(state);
  const hasCalendar = state.techs.calendar;
  const pop = state.population.villagers.length;

  return (
    <div className="resource-bar">
      <div className="res-list">
        {RESOURCES.map((r) => {
          const amt = state.resources[r.id].amount;
          const cap = caps[r.id];
          const n = net[r.id];
          const nearCap = amt >= cap * 0.95;
          return (
            <div className="res-item" key={r.id}>
              <span className="res-name">{r.name}</span>
              <span className={'res-amt' + (nearCap ? ' near-cap' : '')}>
                {fmt(amt)}
                <span className="res-cap"> / {fmt(cap)}</span>
              </span>
              <span className={'res-net ' + (n >= 0 ? 'pos' : 'neg')}>
                {fmtSigned(n)}/秒
              </span>
            </div>
          );
        })}
        <div className="res-item">
          <span className="res-name">人口</span>
          <span className="res-amt">
            {pop}
            <span className="res-cap"> / {maxPop(state)}</span>
          </span>
        </div>
      </div>
      <div className="calendar">
        <span className="season">
          {SEASON_ICONS[state.calendar.season]} {SEASON_NAMES[state.calendar.season]}
        </span>
        <span className="year">第 {state.calendar.year} 年</span>
        {hasCalendar && (
          <span className="day">
            {state.calendar.day + 1}/{DAYS_PER_SEASON} 日
          </span>
        )}
      </div>
    </div>
  );
}
