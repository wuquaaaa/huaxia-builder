import { useGame } from './useGame';
import { JOBS } from '../data/jobs.data';
import { RESOURCE_MAP } from '../data/resources.data';
import { assignJob, idleCount, jobCount, unassignJob } from '../store/gameStore';
import { fmt } from '../core/util';
import { maxPop } from '../core/population';
import type { ResourceId } from '../core/types';

export function JobsPanel() {
  const state = useGame();
  const idle = idleCount();
  const total = state.population.villagers.length;

  const available = JOBS.filter((j) => !j.requiresTech || state.techs[j.requiresTech]);

  return (
    <div className="panel">
      <h2>民生 · 工役分派</h2>
      <div className="pop-summary">
        总人口 {total} / {maxPop(state)} ·{' '}
        <span className={idle > 0 ? 'idle-hl' : ''}>白身(闲置) {idle}</span>
      </div>

      {total === 0 && <div className="hint">尚无人口。营造民居与农田后，会有人家迁入。</div>}

      <div className="job-list">
        {available.map((j) => {
          const cnt = jobCount(j.id);
          const out = (Object.entries(j.produces) as [ResourceId, number][])
            .map(([res, v]) => `${RESOURCE_MAP[res].name} +${v}/秒`)
            .join('，');
          return (
            <div className="job-item" key={j.id}>
              <div className="job-info">
                <span className="job-name">{j.name}</span>
                <span className="job-out">{out}</span>
              </div>
              <div className="job-ctrl">
                <button disabled={cnt === 0} onClick={() => unassignJob(j.id)}>
                  −
                </button>
                <span className="job-count">{cnt}</span>
                <button disabled={idle === 0} onClick={() => assignJob(j.id)}>
                  ＋
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hint small">提示：百姓在岗越久，技艺越高，产量最多 +100%。</div>
    </div>
  );
}
