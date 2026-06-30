import type { GameState, ResourceId, LogEntry } from '../core/state';
import { createInitialState } from '../core/state';
import { runTicks } from '../core/engine';
import { save, load, importSave, exportSave, clearSave } from '../core/save';
import { applyOfflineProgress } from '../core/offline';
import { computeNet, computeCaps } from '../core/resources';
import { getPrice, canAfford, canAffordN, build } from '../core/buildings';
import { canResearch, getAvailableTechs, research } from '../core/tech';
import { gather, setVillagerJob } from './actions';

export type { ResourceId };

// ── Subscription store ──
type Listener = () => void;

class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();
  private rafId: number | null = null;
  private lastSnapshot = 0;
  private snapshotInterval = 100; // ms

  constructor() {
    const saved = load();
    if (saved) {
      this.state = saved;
      // 离线结算
      const offlineLog = applyOfflineProgress(this.state);
      if (offlineLog) {
        this.state.log.push(offlineLog);
      }
    } else {
      this.state = createInitialState();
    }
    // Start game loop
    this.startLoop();
    // Auto-save
    setInterval(() => save(this.state), 30000);
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) save(this.state);
    });
  }

  getState(): GameState {
    return this.state;
  }

  // Game actions
  gather(): LogEntry[] {
    const results = gather(this.state);
    this.emit();
    return results;
  }

  buildBuilding(bId: string, count: number): LogEntry[] {
    const logs = build(bId as any, count, this.state);
    this.emit();
    return logs;
  }

  setJob(vIndex: number, job: string | null): void {
    setVillagerJob(this.state, vIndex, job as any);
    this.emit();
  }

  researchTech(tId: string): LogEntry | null {
    if (!canResearch(tId as any, this.state)) return null;
    const log = research(tId as any, this.state);
    this.emit();
    return log;
  }

  importSave(base64: string): boolean {
    const imported = importSave(base64);
    if (!imported) return false;
    this.state = imported;
    this.emit();
    return true;
  }

  exportSave(): string {
    return exportSave(this.state);
  }

  clearSave(): void {
    clearSave();
    this.state = createInitialState();
    this.emit();
  }

  // ── Computed queries ──
  getNet() { return computeNet(this.state); }
  getCaps() { return computeCaps(this.state); }
  getPrice(bId: string) { return getPrice(bId as any, this.state); }
  canAfford(bId: string) { return canAfford(bId as any, this.state); }
  canAffordN(bId: string, n: number) { return canAffordN(bId as any, n, this.state); }
  canResearch(tId: string) { return canResearch(tId as any, this.state); }
  getAvailableTechs() { return getAvailableTechs(this.state); }

  // ── Store subscription ──
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): GameState {
    return this.state;
  }

  private emit(): void {
    const now = Date.now();
    if (now - this.lastSnapshot >= this.snapshotInterval) {
      this.lastSnapshot = now;
      for (const l of this.listeners) l();
    }
    // Always notify on manual actions
    for (const l of this.listeners) l();
  }

  private startLoop(): void {
    let lastFrame = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastFrame;
      lastFrame = now;

      runTicks(this.state, elapsed);

      // Throttled snapshot
      if (now - this.lastSnapshot >= this.snapshotInterval) {
        this.lastSnapshot = now;
        for (const l of this.listeners) l();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
}

export const store = new GameStore();
