import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { build, canAfford, getPrice } from '../src/core/buildings';
import { research } from '../src/core/tech';

describe('getPrice', () => {
  it('等比增长：base * ratio^count', () => {
    const s = createInitialState();
    s.buildings.farmland.count = 2;
    // farmland: grain 10, ratio 1.12
    expect(getPrice(s, 'farmland').grain).toBeCloseTo(10 * 1.12 ** 2);
  });
});

describe('canAfford & build', () => {
  it('资源不足无法营造', () => {
    const s = createInitialState();
    s.resources.grain.amount = 5;
    expect(canAfford(s, 'farmland')).toBe(false);
    expect(build(s, 'farmland')).toBe(false);
    expect(s.buildings.farmland.count).toBe(0);
  });

  it('营造成功：扣费且 count+1', () => {
    const s = createInitialState();
    s.resources.grain.amount = 10;
    expect(build(s, 'farmland')).toBe(true);
    expect(s.buildings.farmland.count).toBe(1);
    expect(s.resources.grain.amount).toBeCloseTo(0);
  });
});

describe('解锁', () => {
  it('矿场初始锁定，研习采矿后解锁', () => {
    const s = createInitialState();
    expect(s.buildings.mine.unlocked).toBe(false);
    s.resources.knowledge.amount = 1000;
    research(s, 'calendar');
    research(s, 'mining');
    expect(s.buildings.mine.unlocked).toBe(true);
  });
});
