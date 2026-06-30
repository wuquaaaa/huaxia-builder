import React from 'react';
import type { TechId } from '../core/state';
import { TECHS } from '../data/techs.data';

interface TechInfo {
  id: TechId;
  name: string;
  description: string;
  cost: Record<string, number>;
  researched: boolean;
  canResearch: boolean;
  requires?: string;
}

interface TechPanelProps {
  techs: TechInfo[];
  onResearch: (id: TechId) => void;
}

const TechPanel: React.FC<TechPanelProps> = ({ techs, onResearch }) => {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {techs.map(t => (
          <div key={t.id} style={{
            padding: '12px 14px',
            background: t.researched ? '#1a3a1a' : '#1a1a2e',
            borderRadius: 8,
            border: `1px solid ${t.researched ? '#27ae60' : t.canResearch ? '#e2b04a' : '#333'}`,
            opacity: (!t.researched && !t.canResearch) ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 15 }}>
                  {t.name}
                  {t.researched && <span style={{ color: '#27ae60', marginLeft: 8, fontSize: 12 }}>✓ 已研习</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.description}</div>
                {!t.researched && t.requires && (
                  <div style={{ fontSize: 11, color: '#e2b04a', marginTop: 4 }}>前置：{t.requires}</div>
                )}
              </div>
              {!t.researched && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                    {Object.entries(t.cost).map(([r, c]) => `${r} ${c}`).join(' ')}
                  </div>
                  <button
                    onClick={() => onResearch(t.id)}
                    disabled={!t.canResearch}
                    style={{
                      padding: '4px 14px',
                      fontSize: 12,
                      cursor: t.canResearch ? 'pointer' : 'not-allowed',
                      background: t.canResearch ? '#e2b04a' : '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                    }}
                  >
                    研习
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechPanel;
