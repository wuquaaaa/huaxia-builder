import { useGame } from './useGame';

export function LogPanel() {
  const state = useGame();
  const entries = state.log.slice().reverse();

  return (
    <div className="log-panel">
      <h3>纪事</h3>
      <div className="log-list">
        {entries.length === 0 && <div className="log-empty">村落初创，万象待兴……</div>}
        {entries.map((e, i) => (
          <div className={'log-entry ' + e.type} key={entries.length - i}>
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}
