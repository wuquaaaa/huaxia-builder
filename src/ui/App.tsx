import { useState } from 'react';
import { ResourceBar } from './ResourceBar';
import { BuildingsPanel } from './BuildingsPanel';
import { JobsPanel } from './JobsPanel';
import { TechPanel } from './TechPanel';
import { LogPanel } from './LogPanel';
import { exportSave, importSave, resetGame } from '../store/gameStore';

type Tab = 'village' | 'tech';

export function App() {
  const [tab, setTab] = useState<Tab>('village');

  function handleExport() {
    const code = exportSave();
    navigator.clipboard?.writeText(code).then(
      () => alert('存档已复制到剪贴板。'),
      () => prompt('复制以下存档字符串：', code),
    );
  }

  function handleImport() {
    const code = prompt('粘贴存档字符串：');
    if (!code) return;
    alert(importSave(code) ? '导入成功！' : '导入失败：存档无效。');
  }

  function handleReset() {
    if (confirm('确定要开创新朝（重置所有进度）吗？')) resetGame();
  }

  return (
    <div className="app">
      <header className="title-bar">
        <h1>华夏建造者</h1>
        <div className="save-ctrl">
          <button onClick={handleExport}>导出</button>
          <button onClick={handleImport}>导入</button>
          <button onClick={handleReset}>重置</button>
        </div>
      </header>

      <ResourceBar />

      <nav className="tab-nav">
        <button className={tab === 'village' ? 'active' : ''} onClick={() => setTab('village')}>
          村落
        </button>
        <button className={tab === 'tech' ? 'active' : ''} onClick={() => setTab('tech')}>
          学问
        </button>
      </nav>

      <main className="main-area">
        {tab === 'village' ? (
          <div className="two-col">
            <BuildingsPanel />
            <JobsPanel />
          </div>
        ) : (
          <TechPanel />
        )}
        <LogPanel />
      </main>
    </div>
  );
}
