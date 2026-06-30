import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { computeCaps, computeNet, getMultiplier } from '../src/core/resources';
import { newVillager } from '../src/core/population';
import { VILLAGER_GRAIN_PER_SEC } from '../src/core/constants';
import { SEASON_GRAIN_MUL } from '../src/data/seasons.data';

describe('computeCaps', () => {
  it('谷仓叠加各资源上限', () => {
    const s = createInitialState();
    s.buildings.granary.count = 2;
    const caps = computeCaps(s);
    expect(caps.grain).toBe(5000 + 5000 * 2);
    expect(caps.wood).toBe(200 + 200 * 2);
    expect(caps.minerals).toBe(250 + 250 * 2);
  });

  it('书院叠加学问上限', () => {
    const s = createInitialState();
    s.buildings.academy.count = 3;
    expect(computeCaps(s).knowledge).toBe(250 + 250 * 3);
  });
});

describe('getMultiplier', () => {
  it('矿场对矿工加法叠加 +20%/座', () => {
    const s = createInitialState();
    s.buildings.mine.count = 3;
    expect(getMultiplier('miner', s)).toBeCloseTo(1 + 0.2 * 3);
  });

  it('农耕学问对农夫与农田各 +50%', () => {
    const s = createInitialState();
    s.techs.farming = true;
    expect(getMultiplier('farmer', s)).toBeCloseTo(1.5);
    expect(getMultiplier('farmland', s)).toBeCloseTo(1.5);
  });
});

describe('computeNet', () => {
  it('N 农夫 + M 农田，春季净产等于手算', () => {
    const s = createInitialState();
    s.calendar.season = 0; // 春
    s.buildings.farmland.count = 4; // 0.6 * 4
    const farmers = 3;
    for (let i = 0; i < farmers; i++) {
      const v = newVillager();
      v.job = 'farmer';
      s.population.villagers.push(v);
    }
    const spring = SEASON_GRAIN_MUL[0]; // 1.5
    // 农田被动：0.6*4*1.5 ; 农夫：1.0*3*1.5(skill=0) ; 消耗：3*0.85
    const expected = 0.625 * 4 * spring + 5.0 * farmers * spring - farmers * VILLAGER_GRAIN_PER_SEC;
    expect(computeNet(s).grain).toBeCloseTo(expected);
  });

  it('冬季粮食产量按 0.25 衰减', () => {
    const s = createInitialState();
    s.buildings.farmland.count = 10;
    s.calendar.season = 3; // 冬
    expect(computeNet(s).grain).toBeCloseTo(0.625 * 10 * 0.25);
  });
});
