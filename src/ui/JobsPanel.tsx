import React from 'react';
import type { Villager, JobId } from '../core/state';
import { JOBS } from '../data/jobs.data';

interface JobsPanelProps {
  villagers: Villager[];
  onSetJob: (vIndex: number, job: JobId | null) => void;
}

const JobsPanel: React.FC<JobsPanelProps> = ({ villagers, onSetJob }) => {
  const jobCounts: Record<string, number> = {};
  const idleCount = villagers.filter(v => v.job === null).length;
  for (const v of villagers) {
    if (v.job) {
      jobCounts[v.job] = (jobCounts[v.job] ?? 0) + 1;
    }
  }

  const jobIds = Object.keys(JOBS) as JobId[];

  if (villagers.length === 0) {
    return (
      <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>
        尚无百姓。先建民居以拓宽人口容纳。
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Summary */}
      <div style={{ marginBottom: 16, fontSize: 14, color: '#aaa' }}>
        总人口：{villagers.length}　　白身（闲置）：{idleCount}
        {jobIds.map(jId => {
          const c = jobCounts[jId] ?? 0;
          return c > 0 ? <span key={jId}>　{JOBS[jId].name}：{c}</span> : null;
        })}
      </div>

      {/* Villager list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {villagers.map((v, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: '#1a1a2e',
            borderRadius: 8,
            border: '1px solid #0f3460',
          }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>{v.name}</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#e2b04a' }}>
                {v.job ? JOBS[v.job]?.name ?? v.job : '白身'}
              </span>
              {v.skill > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#888' }}>
                  技艺 {(v.skill * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <select
              value={v.job ?? 'idle'}
              onChange={e => {
                const val = e.target.value;
                onSetJob(i, val === 'idle' ? null : val as JobId);
              }}
              style={{
                padding: '4px 8px',
                background: '#16213e',
                color: '#e0d7c6',
                border: '1px solid #0f3460',
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <option value="idle">白身</option>
              {jobIds.map(jId => (
                <option key={jId} value={jId}>{JOBS[jId].name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsPanel;
