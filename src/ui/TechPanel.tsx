import { useGame } from './useGame';
import { TECHS } from '../data/techs.data';
import { RESOURCE_MAP } from '../data/resources.data';
import { canResearch, isVisible } from '../core/tech';
import { doResearch } from '../store/gameStore';
import { fmt } from '../core/util';
import type { ResourceId } from '../core/types';

export function TechPanel() {
  const state = useGame();
  const researched = TECHS.filter((t) => state.techs[t.id]);
  const available = TECHS.filter((t) => isVisible(state, t.id));

  return (
    <div className="panel">
      <h2>学问 · 治学</h2>

      <div className="tech-list">
        {available.length === 0 && researched.length === TECHS.length && (
          <div className="hint">本期学问已尽数习得。</div>
        )}
        {available.map((t) => {
          const cost = (Object.entries(t.cost) as [ResourceId, number][])
            .map(([res, v]) => `${RESOURCE_MAP[res].name} ${fmt(v)}`)
            .join('，');
          const ok = canResearch(state, t.id);
          return (
            <div className="tech-item" key={t.id}>
              <div className="tech-head">
                <span className="tech-name">{t.name}</span>
                <button disabled={!ok} onClick={() => doResearch(t.id)}>
                  研习
                </button>
              </div>
              <div className="tech-desc">{t.description}</div>
              <div className={'tech-cost' + (ok ? '' : ' unaffordable')}>耗: {cost}</div>
            </div>
          );
        })}
      </div>

      {researched.length > 0 && (
        <div className="tech-done">
          已习得：{researched.map((t) => t.name).join('、')}
        </div>
      )}
    </div>
  );
}
