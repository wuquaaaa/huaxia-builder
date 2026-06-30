import { DAYS_PER_SEASON } from '../data/seasons.data';

// ── Resources ──
export type ResourceId = 'grain' | 'wood' | 'minerals' | 'knowledge';

export interface ResourceConfig {
  id: ResourceId;
  name: string;
  baseCap: number;
  storable: boolean;
}

export interface ResourceState {
  amount: number;
}

// ── Buildings ──
export type BuildingId = 'farmland' | 'house' | 'academy' | 'granary' | 'mine';

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  prices: Partial<Record<ResourceId, number>>;
  priceRatio: number;
  produces?: Partial<Record<ResourceId, number>>;
  affectedBySeason?: ResourceId[];
  capBonus?: Partial<Record<ResourceId, number>>;
  maxPop?: number;
  requiresTech?: TechId;
  multipliers?: { target: ResourceId | JobId; factor: number };
}

export interface BuildingState {
  count: number;
  unlocked: boolean;
}

// ── Jobs & Population ──
export type JobId = 'farmer' | 'woodcutter' | 'scholar' | 'miner';

export interface JobConfig {
  id: JobId;
  name: string;
  produces: Partial<Record<ResourceId, number>>;
  affectedBySeason?: ResourceId[];
  requiresTech?: TechId;
}

export interface Villager {
  name: string;
  job: JobId | null;
  skill: number;
}

export interface PopulationState {
  villagers: Villager[];
  growthProgress: number;
  starveTimer: number;
}

// ── Tech ──
export type TechId = 'calendar' | 'farming' | 'mining';

export interface TechConfig {
  id: TechId;
  name: string;
  cost: Partial<Record<ResourceId, number>>;
  requires?: TechId[];
  unlocksBuildings?: BuildingId[];
  unlocksJobs?: JobId[];
  description: string;
}

// ── Calendar ──
export interface CalendarState {
  day: number;
  season: 0 | 1 | 2 | 3;
  year: number;
}

// ── Log ──
export interface LogEntry {
  ts: number;
  type: 'info' | 'warn' | 'event';
  text: string;
}

// ── GameState ──
export interface GameState {
  version: number;
  lastTick: number;
  resources: Record<ResourceId, ResourceState>;
  buildings: Record<BuildingId, BuildingState>;
  techs: Record<TechId, boolean>;
  population: PopulationState;
  calendar: CalendarState;
  log: LogEntry[];
  // 预留扩展
  trade: Record<string, unknown>;
  religion: Record<string, unknown>;
  paragon: Record<string, unknown>;
  voyage: Record<string, unknown>;
}

// ── Constants ──
export const CURRENT_VERSION = 1;
export const TICKS_PER_SECOND = 5;
export const VILLAGER_GRAIN_PER_SEC = 0.85;
export const BASE_MAX_POP = 0;
export const GROWTH_PER_SEC = 0.01;
export const SKILL_PER_SEC = 0.0005;
export const SKILL_MAX_BONUS = 1.0;
export const GATHER_GRAIN_PER_CLICK = 1;
export const STARVE_INTERVAL = 5;
export const LOG_MAX = 50;

// ── Initial state factory ──
export function createInitialState(): GameState {
  const buildingIds: BuildingId[] = ['farmland', 'house', 'academy', 'granary', 'mine'];
  const techIds: TechId[] = ['calendar', 'farming', 'mining'];
  const resourceIds: ResourceId[] = ['grain', 'wood', 'minerals', 'knowledge'];

  const resources = {} as Record<ResourceId, ResourceState>;
  for (const id of resourceIds) {
    resources[id] = { amount: 0 };
  }

  const buildings = {} as Record<BuildingId, BuildingState>;
  for (const id of buildingIds) {
    buildings[id] = { count: 0, unlocked: true };
  }
  // 矿场一开始不可见
  buildings.mine.unlocked = false;

  const techs = {} as Record<TechId, boolean>;
  for (const id of techIds) {
    techs[id] = false;
  }

  return {
    version: CURRENT_VERSION,
    lastTick: Date.now(),
    resources,
    buildings,
    techs,
    population: {
      villagers: [],
      growthProgress: 0,
      starveTimer: 0,
    },
    calendar: {
      day: 0,
      season: 0 as 0,
      year: 0,
    },
    log: [{ ts: Date.now(), type: 'event', text: '荒野之中，你找到了一片可以开垦的土地……' }],
    trade: {},
    religion: {},
    paragon: {},
    voyage: {},
  };
}

// ── Name generation ──
const SURNAMES = ['赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨','朱','秦','许','何',
  '吕','张','孔','曹','严','华','金','魏','陶','姜','戚','谢','邹','苏','潘','葛','范','彭','鲁','马',
  '方','任','袁','柳','唐','薛','雷','贺','倪','汤','滕','殷','罗','毕','郝','邹','安','常','乐','于'];
const GIVENS_M = ['大','文','明','安','平','昌','义','勇','仁','信','忠','德','福','寿','康','宁','仲','伯','叔','季',
  '子','世','永','长','庆','延','继','宗','道','思'];
const GIVENS_F = ['兰','梅','菊','竹','秀','芳','英','丽','凤','娥','燕','娥','云','月','雪','春','秋','冬','红','翠',
  '君','淑','贞','巧','慧','婉','若','静','玉','香'];

let villagerId = 0;
export function newVillager(): Villager {
  villagerId++;
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const isFemale = Math.random() > 0.5;
  const givens = isFemale ? GIVENS_F : GIVENS_M;
  const given = givens[Math.floor(Math.random() * givens.length)];
  return { name: surname + given, job: null, skill: 0 };
}
