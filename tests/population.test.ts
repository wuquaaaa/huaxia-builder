import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { maxPop, newVillager, updatePopulation } from '../src/core/population';
import { computeNet } from '../src/core/resources';
import { runTick } from '../src/core/engine';
import {
  GROWTH_PER_SEC,
  SKILL_CAP,
  STARVE_INTERVAL,
  TICKS_PER_SECOND,
} from '../src/core/constants';

describe('maxPop', () => {
  it('民居每座提供 2 人上限', () => {
    const s = createInitialState();
    s.buildings.house.count = 5;
    expect(maxPop(s)).toBe(10);
  });
});

describe('人口增长', () => {
  it('净产≥0 且有粮未满员 → 经过 1/GROWTH 秒恰好 +1 人', () => {
    const s = createInitialState();
    s.buildings.house.count = 5; // 上限 10
    s.buildings.farmland.count = 50; // 大量粮食保证净产>0
    s.resources.grain.amount = 100;
    const dt = 1 / TICKS_PER_SECOND;
    const ticksNeeded = Math.ceil(1 / (GROWTH_PER_SEC * dt));
    for (let i = 0; i < ticksNeeded; i++) {
      const net = computeNet(s);
      updatePopulation(s, dt, net);
    }
    expect(s.population.villagers.length).toBe(1);
  });

  it('满员后不再增长', () => {
    const s = createInitialState();
    s.buildings.house.count = 1; // 上限 2
    s.buildings.farmland.count = 50;
    s.resources.grain.amount = 100;
    for (let i = 0; i < 5000; i++) {
      const net = computeNet(s);
      updatePopulation(s, 1 / TICKS_PER_SECOND, net);
    }
    expect(s.population.villagers.length).toBe(2);
  });
});

describe('饥荒', () => {
  it('粮尽且净产<0 → STARVE_INTERVAL 后 -1 人', () => {
    const s = createInitialState();
    // 2 名白身，无农田无粮 → 净产为负
    s.population.villagers.push(newVillager(), newVillager());
    s.resources.grain.amount = 0;
    const dt = 1 / TICKS_PER_SECOND;
    const ticks = Math.ceil(STARVE_INTERVAL / dt);
    for (let i = 0; i < ticks; i++) {
      const net = computeNet(s);
      updatePopulation(s, dt, net);
    }
    expect(s.population.villagers.length).toBe(1);
  });
});

describe('技艺', () => {
  it('在役技艺随时间增长并封顶于 SKILL_CAP', () => {
    const s = createInitialState();
    const v = newVillager();
    v.job = 'farmer';
    s.population.villagers.push(v);
    s.buildings.farmland.count = 100;
    s.resources.grain.amount = 100;
    for (let i = 0; i < 100000; i++) {
      updatePopulation(s, 1 / TICKS_PER_SECOND, computeNet(s));
    }
    expect(v.skill).toBeCloseTo(SKILL_CAP);
    expect(v.skill).toBeLessThanOrEqual(SKILL_CAP);
  });
});

describe('runTick 集成', () => {
  it('资源不会超过上限', () => {
    const s = createInitialState();
    s.buildings.farmland.count = 1000;
    s.resources.grain.amount = 4999;
    for (let i = 0; i < 100; i++) runTick(s, 1 / TICKS_PER_SECOND);
    expect(s.resources.grain.amount).toBeLessThanOrEqual(5000);
    expect(s.resources.grain.amount).toBeGreaterThanOrEqual(0);
  });
});
