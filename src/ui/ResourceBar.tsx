import React, { useCallback } from 'react';
import type { ResourceId } from '../core/state';
import { RESOURCES } from '../data/resources.data';

export interface ResourceData {
  id: ResourceId;
  amount: number;
  cap: number;
  net: number;
}

interface ResourceBarProps {
  resources: ResourceData[];
}

const EMOJI: Record<ResourceId, string> = {
  grain: '🌾',
  wood: '🪵',
  minerals: '⛏️',
  knowledge: '📚',
};

const ResourceBar: React.FC<ResourceBarProps> = ({ resources }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '10px 16px',
      background: '#16213e',
      borderBottom: '2px solid #0f3460',
      flexWrap: 'wrap',
      justifyContent: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {resources.map(r => {
        const pct = r.cap > 0 ? (r.amount / r.cap) * 100 : 0;
        const nearCap = pct > 95;
        const negNet = r.net < 0;
        return (
          <div key={r.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4px 12px',
            background: '#1a1a2e',
            borderRadius: 8,
            border: `2px solid ${nearCap ? '#e2b04a' : negNet ? '#c0392b' : '#0f3460'}`,
            minWidth: 110,
          }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{EMOJI[r.id]} {RESOURCES[r.id]?.name ?? r.id}</div>
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: nearCap ? '#f1c40f' : '#e0d7c6',
            }}>
              {r.amount.toFixed(1)}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>
              / {r.cap.toFixed(0)}
            </div>
            <div style={{
              fontSize: 11,
              color: r.net > 0 ? '#27ae60' : r.net < 0 ? '#c0392b' : '#777',
            }}>
              {r.net >= 0 ? '+' : ''}{r.net.toFixed(1)}/s
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(ResourceBar);
