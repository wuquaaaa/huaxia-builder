import { describe, it, expect } from 'vitest';
import { createInitialState, CURRENT_VERSION } from '../src/core/state';
import { save, load, exportSave, importSave, clearSave, migrate } from '../src/core/save';

describe('save', () => {
  it('save/load round-trips correctly', () => {
    const s = createInitialState();
    s.resources.grain.amount = 1234;
    s.buildings.farmland.count = 3;
    s.calendar.day = 50;
    s.calendar.season = 2;
    s.calendar.year = 5;

    save(s);
    const loaded = load();

    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(CURRENT_VERSION);
    expect(loaded!.resources.grain.amount).toBeCloseTo(1234, 0);
    expect(loaded!.buildings.farmland.count).toBe(3);
    expect(loaded!.calendar.year).toBe(5);
    expect(loaded!.calendar.season).toBe(2);
    expect(loaded!.calendar.day).toBe(50);

    clearSave();
  });

  it('export/import round-trips', () => {
    const s = createInitialState();
    s.techs.calendar = true;
    s.resources.wood.amount = 999;

    const b64 = exportSave(s);
    const imported = importSave(b64);
    expect(imported).not.toBeNull();
    expect(imported!.techs.calendar).toBe(true);
    expect(imported!.resources.wood.amount).toBe(999);
  });

  it('import rejects invalid data', () => {
    expect(importSave('')).toBeNull();
    expect(importSave('not-base64!!!')).toBeNull();
    expect(importSave('eyJub3RfdmFsaWQiOiB0cnVlfQ==')).toBeNull(); // base64 of {"not_valid": true}
  });

  it('migrate adds missing fields', () => {
    const old = {
      version: 0,
      lastTick: Date.now(),
      resources: { grain: { amount: 100 }, wood: { amount: 0 }, minerals: { amount: 0 }, knowledge: { amount: 0 } },
      buildings: { farmland: { count: 1, unlocked: true }, house: { count: 0, unlocked: true }, academy: { count: 0, unlocked: true }, granary: { count: 0, unlocked: true }, mine: { count: 0, unlocked: false } },
      techs: { calendar: false, farming: false, mining: false },
      population: { villagers: [], growthProgress: 0, starveTimer: 0 },
      calendar: { day: 0, season: 0 as const, year: 0 },
      log: [],
    };
    const migrated = migrate(old as any);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.trade).toBeDefined();
    expect(migrated.religion).toBeDefined();
    expect(migrated.paragon).toBeDefined();
    expect(migrated.voyage).toBeDefined();
  });
});
