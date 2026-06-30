import type { ResourceId, ResourceConfig } from '../core/state';

export const RESOURCES: Record<ResourceId, ResourceConfig> = {
  grain: { id: 'grain', name: '粮食', baseCap: 5000, storable: true },
  wood:  { id: 'wood',  name: '木材', baseCap: 200,  storable: true },
  minerals: { id: 'minerals', name: '矿石', baseCap: 250, storable: true },
  knowledge: { id: 'knowledge', name: '学问', baseCap: 250, storable: true },
};
