import type { JobId, JobConfig } from '../core/state';

export const JOBS: Record<JobId, JobConfig> = {
  farmer: {
    id: 'farmer',
    name: '农夫',
    produces: { grain: 1.0 },
    affectedBySeason: ['grain'],
  },
  woodcutter: {
    id: 'woodcutter',
    name: '樵夫',
    produces: { wood: 0.018 },
  },
  scholar: {
    id: 'scholar',
    name: '书生',
    produces: { knowledge: 0.035 },
  },
  miner: {
    id: 'miner',
    name: '矿工',
    produces: { minerals: 0.05 },
    requiresTech: 'mining',
  },
};
