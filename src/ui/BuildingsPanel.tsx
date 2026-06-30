import React, { useState, useCallback } from 'react';
import type { BuildingId } from '../core/state';
import { BUILDINGS } from '../data/buildings.data';

interface BuildingInfo {
  id: BuildingId;
  name: string;
  count: number;
  unlocked: boolean;
  price: Record<string, number>;
  canAfford: boolean;
  maxBuild: number;
  produces?: string;
}

interface BuildingsPanelProps {
  buildings: BuildingInfo[];
  hasVillagers: boolean;
  onBuild: (id: BuildingId, count: number) => void;
  onGather: () => void;
}

const BuildingsPanel: React.FC<BuildingsPanelProps> = ({ buildings, hasVillagers, onBuild, onGather }) => {
  return (
    <div style={{ padding: 16 }}>
      {/* Gather button - always visible */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={onGather}
          style={{
            padding: '12px 32px',
            fontSize: 18,
            cursor: 'pointer',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 'bold',
          }}
        >
          🌾 采集粮食 (+1)
        </button>
        {!hasVillagers && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
            暂无百姓，点击采集粮食积攒初始资源
          </div>
        )}
      </div>

      {/* Building list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buildings.filter(b => b.unlocked).map(b => (
          <BuildingRow key={b.id} b={b} onBuild={onBuild} />
        ))}
      </div>
    </div>
  );
};

const BuildingRow: React.FC<{
  b: BuildingInfo;
  onBuild: (id: BuildingId, count: number) => void;
}> = ({ b, onBuild }) => {
  const priceStr = Object.entries(b.price)
    .map(([r, c]) => `${r}=${c}`)
    .join(' ');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      background: '#1a1a2e',
      borderRadius: 8,
      border: '1px solid #0f3460',
    }}>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: 15 }}>
          {b.name} <span style={{ color: '#888', fontSize: 13 }}>×{b.count}</span>
        </div>
        {b.produces && (
          <div style={{ fontSize: 11, color: '#27ae60' }}>{b.produces}</div>
        )}
        <div style={{ fontSize: 11, color: '#e2b04a' }}>成本: {priceStr}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <BuildBtn onClick={() => onBuild(b.id, 1)} disabled={!b.canAfford} label="×1" />
        <BuildBtn onClick={() => onBuild(b.id, 10)} disabled={b.maxBuild < 10} label="×10" />
        <BuildBtn onClick={() => onBuild(b.id, b.maxBuild)} disabled={b.maxBuild === 0} label={`×${b.maxBuild}`} />
      </div>
    </div>
  );
};

const BuildBtn: React.FC<{ onClick: () => void; disabled: boolean; label: string }> = ({ onClick, disabled, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '4px 12px',
      fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? '#333' : '#c0392b',
      color: disabled ? '#666' : '#fff',
      border: 'none',
      borderRadius: 6,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {label}
  </button>
);

export default BuildingsPanel;
