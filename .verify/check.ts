import assert from 'node:assert';
import { createInitialState } from '../src/core/state';
import { computeCaps, computeNet, getMultiplier } from '../src/core/resources';
import { build, canAfford, getPrice } from '../src/core/buildings';
import { research } from '../src/core/tech';
import { advanceCalendar } from '../src/core/calendar';
import { updatePopulation, newVillager, maxPop } from '../src/core/population';
import { runTick } from '../src/core/engine';
import { SEASON_GRAIN_MUL } from '../src/data/seasons.data';
import {
  VILLAGER_GRAIN_PER_SEC,
  TICKS_PER_SECOND,
  GROWTH_PER_SEC,
  STARVE_INTERVAL,
  SKILL_CAP,
  DAY_LENGTH_MS,
  DAYS_PER_SEASON,
} from '../src/core/constants';

let pass = 0;
let fail = 0;
function t(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    fail++;
    console.log('  ✗ ' + name + ' -> ' + (e as Error).message);
  }
}
const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const dt = 1 / TICKS_PER_SECOND;

console.log('resources/caps');
t('谷仓叠加粮食上限', () => {
  const s = createInitialState();
  s.buildings.granary.count = 2;
  assert.equal(computeCaps(s).grain, 5000 + 5000 * 2);
});
t('书院叠加学问上限', () => {
  const s = createInitialState();
  s.buildings.academy.count = 3;
  assert.equal(computeCaps(s).knowledge, 250 + 250 * 3);
});

console.log('multiplier');
t('矿场对矿工 +20%/座(加法叠加)', () => {
  const s = createInitialState();
  s.buildings.mine.count = 3;
  close(getMultiplier('miner', s), 1.6);
});
t('农耕对农夫/农田各 +50%', () => {
  const s = createInitialState();
  s.techs.farming = true;
  close(getMultiplier('farmer', s), 1.5);
  close(getMultiplier('farmland', s), 1.5);
});

console.log('net');
t('春季 N农夫+M农田 净产=手算', () => {
  const s = createInitialState();
  s.calendar.season = 0;
  s.buildings.farmland.count = 4;
  const farmers = 3;
  for (let i = 0; i < farmers; i++) {
    const v = newVillager();
    v.job = 'farmer';
    s.population.villagers.push(v);
  }
  const spring = SEASON_GRAIN_MUL[0];
  const expected = 0.625 * 4 * spring + 5.0 * farmers * spring - farmers * VILLAGER_GRAIN_PER_SEC;
  close(computeNet(s).grain, expected);
});
t('冬季粮产按 0.25 衰减', () => {
  const s = createInitialState();
  s.buildings.farmland.count = 10;
  s.calendar.season = 3;
  close(computeNet(s).grain, 0.625 * 10 * 0.25);
});

console.log('buildings/tech');
t('价格等比 base*ratio^count', () => {
  const s = createInitialState();
  s.buildings.farmland.count = 2;
  close(getPrice(s, 'farmland').grain!, 10 * 1.12 ** 2);
});
t('资源不足无法营造', () => {
  const s = createInitialState();
  s.resources.grain.amount = 5;
  assert.equal(canAfford(s, 'farmland'), false);
  assert.equal(build(s, 'farmland'), false);
  assert.equal(s.buildings.farmland.count, 0);
});
t('营造成功扣费且count+1', () => {
  const s = createInitialState();
  s.resources.grain.amount = 10;
  assert.equal(build(s, 'farmland'), true);
  assert.equal(s.buildings.farmland.count, 1);
  close(s.resources.grain.amount, 0);
});
t('采矿解锁矿场', () => {
  const s = createInitialState();
  assert.equal(s.buildings.mine.unlocked, false);
  s.resources.knowledge.amount = 1000;
  research(s, 'calendar');
  research(s, 'mining');
  assert.equal(s.buildings.mine.unlocked, true);
});

console.log('population');
t('民居每座 +2 上限', () => {
  const s = createInitialState();
  s.buildings.house.count = 5;
  assert.equal(maxPop(s), 10);
});
t('净产≥0未满员 → 1/GROWTH 秒后 +1 人', () => {
  const s = createInitialState();
  s.buildings.house.count = 5;
  s.buildings.farmland.count = 50;
  s.resources.grain.amount = 100;
  const need = Math.ceil(1 / (GROWTH_PER_SEC * dt));
  for (let i = 0; i < need; i++) updatePopulation(s, dt, computeNet(s));
  assert.equal(s.population.villagers.length, 1);
});
t('满员后不再增长', () => {
  const s = createInitialState();
  s.buildings.house.count = 1;
  s.buildings.farmland.count = 50;
  s.resources.grain.amount = 100;
  for (let i = 0; i < 5000; i++) updatePopulation(s, dt, computeNet(s));
  assert.equal(s.population.villagers.length, 2);
});
t('粮尽且净产<0 → STARVE_INTERVAL 后 -1 人', () => {
  const s = createInitialState();
  s.population.villagers.push(newVillager(), newVillager());
  s.resources.grain.amount = 0;
  const ticks = Math.ceil(STARVE_INTERVAL / dt);
  for (let i = 0; i < ticks; i++) updatePopulation(s, dt, computeNet(s));
  assert.equal(s.population.villagers.length, 1);
});
t('技艺增长并封顶', () => {
  const s = createInitialState();
  const v = newVillager();
  v.job = 'farmer';
  s.population.villagers.push(v);
  s.buildings.farmland.count = 100;
  s.resources.grain.amount = 100;
  for (let i = 0; i < 100000; i++) updatePopulation(s, dt, computeNet(s));
  close(v.skill, SKILL_CAP);
  assert.ok(v.skill <= SKILL_CAP);
});

console.log('engine/calendar');
t('资源不超上限不低于0', () => {
  const s = createInitialState();
  s.buildings.farmland.count = 1000;
  s.resources.grain.amount = 4999;
  for (let i = 0; i < 100; i++) runTick(s, dt);
  assert.ok(s.resources.grain.amount <= 5000 && s.resources.grain.amount >= 0);
});
t('满一季换季', () => {
  const s = createInitialState();
  advanceCalendar(s, (DAYS_PER_SEASON * DAY_LENGTH_MS) / 1000);
  assert.equal(s.calendar.season, 1);
  assert.equal(s.calendar.day, 0);
});
t('满四季换年', () => {
  const s = createInitialState();
  advanceCalendar(s, (DAYS_PER_SEASON * DAY_LENGTH_MS * 4) / 1000);
  assert.equal(s.calendar.season, 0);
  assert.equal(s.calendar.year, 2);
});

console.log(`\n结果：${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
