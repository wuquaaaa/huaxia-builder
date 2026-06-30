import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../core/state';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={{
      padding: 10,
      maxHeight: 200,
      overflowY: 'auto',
      borderTop: '1px solid #0f3460',
      fontSize: 12,
    }}>
      {logs.slice(-30).map((l, i) => (
        <div key={i} style={{
          padding: '2px 0',
          color: l.type === 'warn' ? '#e74c3c' : l.type === 'event' ? '#f1c40f' : '#888',
        }}>
          {l.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default LogPanel;
