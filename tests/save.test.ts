import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { serialize, deserialize, migrate } from '../src/core/save';
import { newVillager } from '../src/core/population';

describe('存档往返', () => {
  it('serialize→deserialize 后关键字段一致', () => {
    const s = createInitialState();
    s.resources.grain.amount = 1234;
    s.resources.wood.amount = 56;
    s.buildings.farmland.count = 7;
    s.techs.calendar = true;
    s.calendar = { day: 33, season: 2, year: 5 };
    const v = newVillager();
    v.job = 'farmer';
    v.skill = 0.4;
    s.population.villagers.push(v);

    const restored = deserialize(serialize(s))!;
    expect(restored).not.toBeNull();
    expect(restored.resources.grain.amount).toBeCloseTo(1234);
    expect(restored.resources.wood.amount).toBeCloseTo(56);
    expect(restored.buildings.farmland.count).toBe(7);
    expect(restored.techs.calendar).toBe(true);
    expect(restored.calendar).toEqual({ day: 33, season: 2, year: 5 });
    expect(restored.population.villagers).toHaveLength(1);
    expect(restored.population.villagers[0].job).toBe('farmer');
  });
});

describe('迁移', () => {
  it('旧存档缺字段经 migrate 后补全且不报错', () => {
    const partial: any = {
      resources: { grain: { amount: 10 } }, // 缺 wood/minerals/knowledge
      buildings: {}, // 缺全部
      techs: {},
      calendar: { day: 0, season: 0, year: 1 },
    };
    const s = migrate(partial);
    expect(s.resources.wood).toEqual({ amount: 0 });
    expect(s.resources.knowledge).toEqual({ amount: 0 });
    expect(s.buildings.farmland).toBeDefined();
    expect(s.buildings.mine.unlocked).toBe(false);
    expect(s.techs.mining).toBe(false);
    expect(s.population.villagers).toEqual([]);
    expect(s.version).toBeGreaterThanOrEqual(1);
  });

  it('非法字符串返回 null', () => {
    expect(deserialize('not-a-valid-save!!!')).toBeNull();
  });
});
