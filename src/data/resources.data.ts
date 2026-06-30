import type { ResourceConfig, ResourceId } from '../core/types';

export const RESOURCES: ResourceConfig[] = [
  { id: 'grain', name: '粮食', baseCap: 5000, storable: true },
  { id: 'wood', name: '木材', baseCap: 200, storable: true },
  { id: 'minerals', name: '矿石', baseCap: 250, storable: true },
  { id: 'knowledge', name: '学问', baseCap: 250, storable: true },
];

export const RESOURCE_IDS = RESOURCES.map((r) => r.id) as ResourceId[];
export const RESOURCE_MAP = Object.fromEntries(
  RESOURCES.map((r) => [r.id, r]),
) as Record<ResourceId, ResourceConfig>;
