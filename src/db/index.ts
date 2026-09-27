// Local-first storage. Everything a person makes lives in this browser's
// IndexedDB; nothing here talks to a server.
import Dexie, { type Table } from 'dexie';
import type { ChartSpec, Row } from '../chart/types';

export interface ChartDoc { id: string; spec: ChartSpec; thumb?: Blob; createdAt: number; updatedAt: number; sharedAt?: number; sharedUrl?: string }
export interface SeriesDoc { id: string; chartId: string; cadence: 'weekly' | 'monthly' | 'quarterly'; nextDue: number; snapshots: { at: number; rows: Row[] }[]; notifiedAt?: number }
export interface BrandDoc { id: 'brand'; palette: string[]; safe: boolean; handle?: string; logo?: Blob; corner: 'br' | 'bl' | 'tr' | 'tl'; applyToNew: boolean }
export interface SettingsDoc { id: 'settings'; handle?: string; lastRoute?: string; migratedAt?: number }

export type StorageState = 'ok' | 'unavailable';

class ChartGenieDb extends Dexie {
  charts!: Table<ChartDoc, string>;
  series!: Table<SeriesDoc, string>;
  brand!: Table<BrandDoc, 'brand'>;
  settings!: Table<SettingsDoc, 'settings'>;

  constructor() {
    super('chartgenie');
    this.version(1).stores({
      charts: 'id, updatedAt, sharedAt',
      series: 'id, chartId, nextDue',
      brand: 'id',
      settings: 'id',
    });
  }
}

export let db: ChartGenieDb = new ChartGenieDb();
let state: StorageState | null = null;

export function storageState(): StorageState {
  return state ?? 'unavailable';
}

export async function openDb(): Promise<StorageState> {
  if (state) return state;
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no indexedDB');
    await db.open();
    state = 'ok';
  } catch {
    state = 'unavailable';
  }
  return state;
}

// Tests swap the IndexedDB factory between cases; production never calls this.
export async function resetDbForTests(): Promise<void> {
  try { db.close(); } catch { /* not open */ }
  // Dexie captures the IndexedDB factory when it loads; tests swap it per case.
  const g = globalThis as { indexedDB?: IDBFactory; IDBKeyRange?: typeof IDBKeyRange };
  Dexie.dependencies.indexedDB = g.indexedDB as IDBFactory;
  if (g.IDBKeyRange) Dexie.dependencies.IDBKeyRange = g.IDBKeyRange;
  db = new ChartGenieDb();
  state = null;
}
