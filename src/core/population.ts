import type { GameState, LogEntry } from './state';
import { newVillager, BASE_MAX_POP, GROWTH_PER_SEC, STARVE_INTERVAL, SKILL_PER_SEC } from './state';
import { BUILDINGS } from '../data/buildings.data';

export function updatePopulation(state: GameState, dt: number, netGrain: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const pop = state.population;

  // 人口上限
  let maxPop = BASE_MAX_POP;
  for (const bId of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    const b = BUILDINGS[bId];
    const count = state.buildings[bId].count;
    if (b.maxPop) maxPop += b.maxPop * count;
  }

  // A. 增长
  if (netGrain >= 0 && state.resources.grain.amount > 0 && pop.villagers.length < maxPop) {
    pop.growthProgress += GROWTH_PER_SEC * dt;
    if (pop.growthProgress >= 1) {
      pop.growthProgress -= 1;
      const v = newVillager();
      pop.villagers.push(v);
      logs.push({ ts: Date.now(), type: 'event', text: `一户人家迁入了村落：${v.name}` });
    }
  }

  // B. 饥荒
  if (state.resources.grain.amount <= 0 && netGrain < 0) {
    pop.starveTimer += dt;
    if (pop.starveTimer >= STARVE_INTERVAL && pop.villagers.length > 0) {
      pop.starveTimer = 0;
      // 优先移除白身 → 低技艺
      pop.villagers.sort((a, b) => {
        if (a.job === null && b.job !== null) return -1;
        if (a.job !== null && b.job === null) return 1;
        return a.skill - b.skill;
      });
      const removed = pop.villagers.shift()!;
      logs.push({ ts: Date.now(), type: 'warn', text: `粮尽！${removed.name} 饿亡流离。（${removed.job ? '在役 ' + removed.job : '白身'}，技艺 ${removed.skill.toFixed(3)}）` });
    }
  } else {
    pop.starveTimer = 0;
  }

  // C. 技艺
  for (const v of pop.villagers) {
    if (v.job !== null) {
      v.skill += SKILL_PER_SEC * dt;
    }
  }

  return logs;
}
