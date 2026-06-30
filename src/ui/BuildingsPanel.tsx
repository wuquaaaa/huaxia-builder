import { useGame } from './useGame';
import { BUILDINGS } from '../data/buildings.data';
import { RESOURCE_MAP } from '../data/resources.data';
import { canAfford, getPrice } from '../core/buildings';
import { doBuild, gather } from '../store/gameStore';
import { fmt } from '../core/util';
import type { ResourceId } from '../core/types';

function priceText(price: Partial<Record<ResourceId, number>>): string {
  return (Object.entries(price) as [ResourceId, number][])
    .map(([res, v]) => `${RESOURCE_MAP[res].name} ${fmt(v)}`)
    .join('，');
}

export function BuildingsPanel() {
  const state = useGame();

  return (
    <div className="panel">
      <h2>村落 · 营造</h2>

      <button className="gather-btn" onClick={gather}>
        🌾 采集粮食 <span className="gather-plus">+1</span>
      </button>

      <div className="build-list">
        {BUILDINGS.filter((b) => state.buildings[b.id].unlocked).map((b) => {
          const count = state.buildings[b.id].count;
          const price = getPrice(state, b.id);
          const afford = canAfford(state, b.id);
          return (
            <div className="build-item" key={b.id}>
              <div className="build-head">
                <span className="build-name">
                  {b.name} <span className="build-count">×{count}</span>
                </span>
                <button disabled={!afford} onClick={() => doBuild(b.id)}>
                  营造
                </button>
              </div>
              <div className="build-desc">{b.desc}</div>
              <div className={'build-price' + (afford ? '' : ' unaffordable')}>
                价: {priceText(price)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
