// ---- 标识符 ----
export type ResourceId = 'grain' | 'wood' | 'minerals' | 'knowledge';
export type BuildingId = 'farmland' | 'house' | 'academy' | 'granary' | 'mine';
export type JobId = 'farmer' | 'woodcutter' | 'scholar' | 'miner';
export type TechId = 'calendar' | 'farming' | 'mining';

// 乘算目标：可以是资源、工役或建筑
export type MultiplierTarget = ResourceId | BuildingId | JobId;
export interface Multiplier {
  target: MultiplierTarget;
  factor: number; // 加法叠加：最终倍率 = 1 + Σ(factor * count)
}

// ---- 配置（只读，来自 data/） ----
export interface ResourceConfig {
  id: ResourceId;
  name: string;
  baseCap: number;
  storable: boolean;
}

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
  multipliers?: Multiplier[];
  desc?: string;
}

export interface JobConfig {
  id: JobId;
  name: string;
  produces: Partial<Record<ResourceId, number>>;
  affectedBySeason?: ResourceId[];
  requiresTech?: TechId;
}

export interface TechConfig {
  id: TechId;
  name: string;
  cost: Partial<Record<ResourceId, number>>;
  requires?: TechId[];
  unlocksBuildings?: BuildingId[];
  unlocksJobs?: JobId[];
  multipliers?: Multiplier[];
  description: string;
}

// ---- 运行时状态 ----
export interface ResourceState {
  amount: number;
}

export interface BuildingState {
  count: number;
  unlocked: boolean;
}

export interface Villager {
  name: string;
  job: JobId | null;
  skill: number; // 0~1
}

export interface PopulationState {
  villagers: Villager[];
  growthProgress: number;
}

export interface CalendarState {
  day: number; // 0~99
  season: 0 | 1 | 2 | 3; // 0春 1夏 2秋 3冬
  year: number;
}

export type LogType = 'info' | 'warn' | 'event';
export interface LogEntry {
  ts: number;
  type: LogType;
  text: string;
}

export interface GameState {
  version: number;
  lastTick: number;
  resources: Record<ResourceId, ResourceState>;
  buildings: Record<BuildingId, BuildingState>;
  techs: Record<TechId, boolean>;
  population: PopulationState;
  calendar: CalendarState;
  log: LogEntry[];
  // 内部累加器（不参与展示）
  _starveTimer: number;
  _dayProgress: number;
}
