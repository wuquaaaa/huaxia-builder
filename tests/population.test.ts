import { describe, it, expect } from 'vitest';
import { createInitialState, GROWTH_PER_SEC, STARVE_INTERVAL, VILLAGER_GRAIN_PER_SEC } from '../src/core/state';
import { runTick } from '../src/core/engine';

describe('population', () => {
  it('grows when grain net >= 0 and villager count < maxPop', () => {
    const s = createInitialState();
    s.buildings.house.count = 1; // maxPop = 2
    s.resources.grain.amount = 1000;
    s.population.villagers.push({ name: '农夫', job: 'farmer', skill: 0 });
    s.lastTick = Date.now();

    // Run enough ticks for 1/GROWTH_PER_SEC = 100 seconds
    const ticks = Math.ceil((1 / GROWTH_PER_SEC) * 5);
    for (let i = 0; i < ticks; i++) {
      runTick(s);
    }
    expect(s.population.villagers.length).toBeGreaterThanOrEqual(2);
  });

  it('does not grow in winter when net grain < 0', () => {
    const s = createInitialState();
    s.calendar.season = 3; // winter, grainMul = 0.25
    s.buildings.house.count = 1;
    s.resources.grain.amount = 10;
    s.population.villagers.push({ name: '农夫', job: 'farmer', skill: 0 });
    s.lastTick = Date.now();

    const ticks = 50;
    for (let i = 0; i < ticks; i++) {
      runTick(s);
    }
    // In winter, farmer produces 1.0*0.25=0.25, consumes 0.85 → net negative
    // Growth should not happen
    expect(s.population.villagers.length).toBe(1);
  });

  it('starves when grain=0 and net < 0', () => {
    const s = createInitialState();
    s.calendar.season = 3; // winter
    s.resources.grain.amount = 0;
    s.population.villagers.push({ name: '饥民', job: null, skill: 0 });
    s.lastTick = Date.now();

    // Run STARVE_INTERVAL worth of ticks
    const ticks = STARVE_INTERVAL * 5 + 5;
    for (let i = 0; i < ticks; i++) {
      runTick(s);
    }
    expect(s.population.villagers.length).toBe(0);
  });

  it('skill increases while on job', () => {
    const s = createInitialState();
    s.resources.grain.amount = 1000;
    s.population.villagers.push({ name: '勤奋', job: 'woodcutter', skill: 0 });
    s.lastTick = Date.now();

    // Run 100 ticks = 20 seconds
    for (let i = 0; i < 100; i++) {
      runTick(s);
    }
    expect(s.population.villagers[0].skill).toBeGreaterThan(0);
  });

  it('idle villager does not gain skill', () => {
    const s = createInitialState();
    s.resources.grain.amount = 1000;
    s.population.villagers.push({ name: '闲人', job: null, skill: 0 });
    s.lastTick = Date.now();

    for (let i = 0; i < 100; i++) {
      runTick(s);
    }
    expect(s.population.villagers[0].skill).toBe(0);
  });
});
