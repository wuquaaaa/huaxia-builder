import React, { useCallback, useSyncExternalStore, useState } from 'react';
import { store, type ResourceId } from '../store/gameStore';
import type { BuildingId, TechId, LogEntry } from '../core/state';
import { RESOURCES } from '../data/resources.data';
import { BUILDINGS } from '../data/buildings.data';
import { TECHS } from '../data/techs.data';
import { SEASONS, DAYS_PER_SEASON } from '../data/seasons.data';
import ResourceBar, { type ResourceData } from './ResourceBar';
import BuildingsPanel from './BuildingsPanel';
import JobsPanel from './JobsPanel';
import TechPanel from './TechPanel';
import LogPanel from './LogPanel';

const App: React.FC = () => {
  const state = useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), []),
    () => store.getSnapshot(),
  );

  const [activeTab, setActiveTab] = useState<'build' | 'jobs' | 'tech'>('build');

  // ── Resource data ──
  const caps = store.getCaps();
  const net = store.getNet();
  const resourceIds = Object.keys(RESOURCES) as ResourceId[];
  const resourceDatas: ResourceData[] = resourceIds.map(id => ({
    id,
    amount: state.resources[id].amount,
    cap: caps[id] ?? 0,
    net: net[id] ?? 0,
  }));

  // ── Building data ──
  const buildingIds = Object.keys(BUILDINGS) as BuildingId[];
  const buildingInfos = buildingIds.map(id => {
    const bConf = BUILDINGS[id];
    const bState = state.buildings[id];
    let producesStr = '';
    if (bConf.produces) {
      producesStr = Object.entries(bConf.produces)
        .map(([r, v]) => `${r} ${v > 0 ? '+' : ''}${v}/s`)
        .join(', ');
    }
    if (bConf.maxPop) {
      producesStr += (producesStr ? '；' : '') + `人口上限 +${bConf.maxPop * bState.count}`;
    }
    return {
      id,
      name: bConf.name,
      count: bState.count,
      unlocked: bState.unlocked,
      price: store.getPrice(id),
      canAfford: store.canAfford(id),
      maxBuild: store.canAffordN(id, 999),
      produces: producesStr || undefined,
    };
  });

  // ── Tech data ──
  const techIds = Object.keys(TECHS) as TechId[];
  const techInfos = techIds.map(id => ({
    id,
    name: TECHS[id].name,
    description: TECHS[id].description,
    cost: TECHS[id].cost as Record<string, number>,
    researched: state.techs[id],
    canResearch: store.canResearch(id),
    requires: TECHS[id].requires?.map(r => TECHS[r].name).join(' → '),
  }));

  // ── Season info ──
  const season = SEASONS[state.calendar.season];
  const seasonDayPct = (state.calendar.day / DAYS_PER_SEASON) * 100;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ResourceBar resources={resourceDatas} />

      {/* Season bar */}
      <div style={{
        padding: '6px 16px',
        background: '#0f3460',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
      }}>
        <span>第 {state.calendar.year} 年</span>
        <span style={{ fontWeight: 'bold' }}>{season.name}（粮 ×{season.grainMul}）</span>
        <div style={{
          flex: 1,
          height: 8,
          background: '#1a1a2e',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${seasonDayPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #27ae60, #f1c40f)',
            borderRadius: 4,
          }} />
        </div>
        <span style={{ fontSize: 11 }}>{state.calendar.day}/{DAYS_PER_SEASON} 天</span>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', borderBottom: '2px solid #0f3460' }}>
        {(['build', 'jobs', 'tech'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 15,
              cursor: 'pointer',
              background: activeTab === tab ? '#16213e' : '#1a1a2e',
              color: activeTab === tab ? '#f1c40f' : '#888',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #f1c40f' : 'none',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
            }}
          >
            {tab === 'build' ? '🏘️ 营造' : tab === 'jobs' ? '👥 工役' : '📚 学问'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, paddingBottom: 16 }}>
        {activeTab === 'build' && (
          <BuildingsPanel
            buildings={buildingInfos}
            hasVillagers={state.population.villagers.length > 0}
            onBuild={(id, n) => store.buildBuilding(id, n)}
            onGather={() => store.gather()}
          />
        )}
        {activeTab === 'jobs' && (
          <JobsPanel
            villagers={state.population.villagers}
            onSetJob={(i, job) => store.setJob(i, job)}
          />
        )}
        {activeTab === 'tech' && (
          <TechPanel
            techs={techInfos}
            onResearch={id => store.researchTech(id)}
          />
        )}
      </div>

      {/* Save / Import bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #0f3460',
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        fontSize: 12,
      }}>
        <button
          onClick={() => {
            const exported = store.exportSave();
            navigator.clipboard.writeText(exported);
            alert('存档已复制到剪贴板！');
          }}
          style={btnStyle}
        >📋 导出存档</button>
        <button
          onClick={() => {
            const input = prompt('粘贴存档字符串：');
            if (input) {
              const ok = store.importSave(input);
              alert(ok ? '导入成功！' : '导入失败：存档格式无效。');
            }
          }}
          style={btnStyle}
        >📥 导入存档</button>
        <button
          onClick={() => {
            if (confirm('确定要清除存档并重新开始吗？此操作不可撤销！')) {
              store.clearSave();
            }
          }}
          style={{ ...btnStyle, background: '#c0392b' }}
        >🗑️ 重置</button>
      </div>

      {/* Log panel */}
      <LogPanel logs={state.log} />
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: '#0f3460',
  color: '#e0d7c6',
  border: '1px solid #1a5276',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
};

export default App;
