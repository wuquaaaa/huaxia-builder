import type { JobConfig, JobId } from '../core/types';

export const JOBS: JobConfig[] = [
  { id: 'farmer', name: '农夫', produces: { grain: 1.0 }, affectedBySeason: ['grain'] },
  { id: 'woodcutter', name: '樵夫', produces: { wood: 0.018 } },
  { id: 'scholar', name: '书生', produces: { knowledge: 0.035 } },
  { id: 'miner', name: '矿工', produces: { minerals: 0.05 }, requiresTech: 'mining' },
];

export const JOB_IDS = JOBS.map((j) => j.id) as JobId[];
export const JOB_MAP = Object.fromEntries(
  JOBS.map((j) => [j.id, j]),
) as Record<JobId, JobConfig>;
