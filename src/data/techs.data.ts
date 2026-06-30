import type { TechId, TechConfig } from '../core/state';

export const TECHS: Record<TechId, TechConfig> = {
  calendar: {
    id: 'calendar',
    name: '历法',
    cost: { knowledge: 30 },
    unlocksBuildings: [],
    unlocksJobs: [],
    description: '观天象而知时节——显示节气天数，可预知换季，规划备荒。',
  },
  farming: {
    id: 'farming',
    name: '农耕',
    cost: { knowledge: 100 },
    requires: ['calendar'],
    unlocksBuildings: [],
    unlocksJobs: [],
    description: '深耕细作——农夫产量 +50%、农田产量 +50%。粮食从此丰足。',
  },
  mining: {
    id: 'mining',
    name: '采矿',
    cost: { knowledge: 100 },
    requires: ['calendar'],
    unlocksBuildings: ['mine'],
    unlocksJobs: ['miner'],
    description: '凿山取矿——解锁矿工工役与矿场建筑，开启矿石资源链。',
  },
};
