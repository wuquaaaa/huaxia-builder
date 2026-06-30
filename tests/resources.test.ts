import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../src/core/state';
import type { GameState } from '../src/core/state';
import { computeNet, computeCaps, getMultiplier } from '../src/core/resources';
import { runTick, runTicks } from '../src/core/engine';

function makeState(): GameState {
  const s = createInitialState();
  s.lastTick = Date.now();
  return s;
}

describe('resources', () => {
  describe('computeCaps', () => {
    it('returns base caps with no buildings', () => {
      const s = makeState();
      const caps = computeCaps(s);
      expect(caps.grain).toBe(5000);
      expect(caps.wood).toBe(200);
      expect(caps.minerals).toBe(250);
      expect(caps.knowledge).toBe(250);
    });

    it('adds cap from granary', () => {
      const s = makeState();
      s.buildings.granary.count = 1;
      const caps = computeCaps(s);
      expect(caps.grain).toBe(10000); // 5000 + 5000
      expect(caps.wood).toBe(400);    // 200 + 200
      expect(caps.minerals).toBe(500);// 250 + 250
    });

    it('stacks multiple granaries', () => {
      const s = makeState();
      s.buildings.granary.count = 3;
      const caps = computeCaps(s);
      expect(caps.grain).toBe(20000);
    });
  });

  describe('computeNet', () => {
    it('produces grain from farmland in spring', () => {
      const s = makeState();
      s.buildings.farmland.count = 1;
      s.calendar.season = 0; // spring
      const net = computeNet(s);
      expect(net.grain).toBeCloseTo(0.6 * 1.5); // 春季 1.5x
    });

    it('reduces grain in winter', () => {
      const s = makeState();
      s.buildings.farmland.count = 1;
      s.calendar.season = 3; // winter
      const net = computeNet(s);
      expect(net.grain).toBeCloseTo(0.6 * 0.25);
    });

    it('farmer produces grain in spring', () => {
      const s = makeState();
      s.population.villagers.push({ name: '张三', job: 'farmer', skill: 0 });
      s.calendar.season = 0;
      const net = computeNet(s);
      // 1.0 * 1.5(spring) - 0.85(consume)
      expect(net.grain).toBeCloseTo(1.0 * 1.5 - 0.85);
    });

    it('woodcutter produces wood', () => {
      const s = makeState();
      s.population.villagers.push({ name: '李四', job: 'woodcutter', skill: 0 });
      const net = computeNet(s);
      expect(net.wood).toBeCloseTo(0.018);
    });

    it('scholar produces knowledge', () => {
      const s = makeState();
      s.population.villagers.push({ name: '王五', job: 'scholar', skill: 0 });
      const net = computeNet(s);
      expect(net.knowledge).toBeCloseTo(0.035);
    });

    it('net = passive + jobs - consumption', () => {
      const s = makeState();
      s.buildings.farmland.count = 2;
      s.population.villagers.push({ name: '赵六', job: 'farmer', skill: 0 });
      s.population.villagers.push({ name: '孙七', job: null, skill: 0 });
      s.calendar.season = 0;
      // farmland: 2 * 0.6 * 1.5 = 1.8
      // farmer: 1.0 * 1.5 = 1.5
      // total: 3.3 - 2*0.85 = 1.6
      const net = computeNet(s);
      expect(net.grain).toBeCloseTo(2 * 0.6 * 1.5 + 1.0 * 1.5 - 2 * 0.85);
    });
  });

  describe('clamp', () => {
    it('clamps resource to cap after tick', () => {
      const s = makeState();
      s.resources.grain.amount = 5000;
      s.buildings.farmland.count = 1;
      s.calendar.season = 0;
      runTick(s);
      expect(s.resources.grain.amount).toBe(5000); // capped
    });

    it('does not go below 0', () => {
      const s = makeState();
      s.resources.grain.amount = 0;
      s.population.villagers.push({ name: '饿死', job: null, skill: 0 });
      s.lastTick = Date.now();
      runTick(s);
      expect(s.resources.grain.amount).toBe(0);
    });
  });
});

describe('multiplier', () => {
  it('adds mine multiplier for miners (additive stacking)', () => {
    const s = makeState();
    s.buildings.mine.count = 3;
    const mul = getMultiplier('miner', s);
    expect(mul).toBeCloseTo(1 + 0.2 * 3); // 1.6
  });

  it('returns 1 without multipliers', () => {
    const s = makeState();
    expect(getMultiplier('farmer', s)).toBe(1);
  });
});
