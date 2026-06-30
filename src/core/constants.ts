export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND; // 200ms
export const DT = 1 / TICKS_PER_SECOND; // 每 tick 秒数

export const VILLAGER_GRAIN_PER_SEC = 4.25; // 每位百姓每秒吃粮食
export const BASE_MAX_POP = 0; // 初始人口上限，靠民居提供
export const GROWTH_PER_SEC = 0.01; // 食物盈余时增长进度/秒
export const SKILL_PER_SEC = 0.0005; // 在役技艺增速
export const SKILL_MAX_BONUS = 1.0; // 技艺满级提供的额外产出倍率
export const SKILL_CAP = 1.0; // 技艺数值上限
export const STARVE_INTERVAL = 5; // 饥荒每隔几秒饿亡一人
export const GATHER_GRAIN_PER_CLICK = 1; // 每次手动采集获得粮食
export const GRAIN_PER_WOOD = 100; // 伐木：消耗多少粮食换 1 木材（早期启动手段）
export const REFINE_WOOD_PER_CLICK = 1; // 每次伐木获得的木材

export const DAY_LENGTH_MS = 2000; // 一天 = 2 秒
export const DAYS_PER_SEASON = 100;

export const LOG_MAX = 50;
export const SAVE_KEY = 'huaxia_save';
export const CURRENT_VERSION = 1;
export const AUTOSAVE_INTERVAL_MS = 30000;
export const EMIT_THROTTLE_MS = 100;
