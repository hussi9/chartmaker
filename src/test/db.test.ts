import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// jsdom's Blob cannot be structured-cloned by fake-indexeddb; Node's can, and real
// browsers clone real Blobs. Use Node's Blob for this file.
globalThis.Blob = NodeBlob as unknown as typeof Blob;
import { db, openDb, resetDbForTests } from '@/db';
import { migrateFromLocalStorage, LEGACY_KEYS } from '@/db/migrate';
import { exportBackup, importBackup, BackupError, blobText } from '@/db/backup';
import { defaultSpec } from '@/chart/types';

// The exact SavedChart shape the live product wrote (src/lib/storage.ts at baseline-2026-09-27).
const legacyChart = {
  id: 'chart_123',
  title: 'Countries',
  subtitle: 'Sample',
  chartType: 'funnel',
  schemeId: 'cyber',
  aspectRatio: '1:1',
  fontFamily: 'Inter',
  bgMode: 'dark',
  showLegend: true,
  showValues: true,
  is3d: true,
  creatorHandle: '@me',
  dataSource: 'Statista',
  showAverageLine: false,
  data: [{ id: '1', name: 'USA', value: 87 }, { id: '2', name: 'Italy', value: 20 }],
  updatedAt: 1700000000000,
};

beforeEach(async () => {
  indexedDB = new IDBFactory();
  localStorage.clear();
  await resetDbForTests();
});

afterEach(() => localStorage.clear());

describe('openDb', () => {
  it('opens under fake-indexeddb', async () => {
    await expect(openDb()).resolves.toBe('ok');
    expect(await db.charts.count()).toBe(0);
  });

  it('reports unavailable and never throws when IndexedDB is missing', async () => {
    const saved = globalThis.indexedDB;
    // @ts-expect-error simulate a browser that blocks storage
    delete globalThis.indexedDB;
    await resetDbForTests();
    await expect(openDb()).resolves.toBe('unavailable');
    globalThis.indexedDB = saved;
  });
});

describe('migrateFromLocalStorage', () => {
  it('converts saved charts and the autosave into v2 docs and renames the keys', async () => {
    localStorage.setItem(LEGACY_KEYS.charts, JSON.stringify([legacyChart]));
    localStorage.setItem(LEGACY_KEYS.autosave, JSON.stringify({ ...legacyChart, id: undefined, title: 'Draft' }));
    await openDb();
    const n = await migrateFromLocalStorage();
    expect(n).toBe(2);
    const docs = await db.charts.toArray();
    expect(docs).toHaveLength(2);
    const c = docs.find((d) => d.spec.text.title === 'Countries')!;
    expect(c.spec.v).toBe(2);
    expect(c.spec.type).toBe('funnel');
    expect(c.spec.size).toBe('1:1');
    expect(c.spec.look).toBe('dark');
    expect(c.spec.options).toMatchObject({ legend: true, depth: true, showHandle: true, handle: 'me' });
    expect(c.spec.data.map((r) => r.label)).toEqual(['USA', 'Italy']);
    expect(c.updatedAt).toBe(1700000000000);
    expect(localStorage.getItem(LEGACY_KEYS.charts)).toBeNull();
    expect(localStorage.getItem(`${LEGACY_KEYS.charts}_migrated`)).not.toBeNull();
    expect((await db.settings.get('settings'))?.migratedAt).toBeGreaterThan(0);
  });

  it('is a no-op the second time and with nothing to migrate', async () => {
    await openDb();
    expect(await migrateFromLocalStorage()).toBe(0);
    localStorage.setItem(LEGACY_KEYS.charts, JSON.stringify([legacyChart]));
    expect(await migrateFromLocalStorage()).toBe(1);
    expect(await migrateFromLocalStorage()).toBe(0);
    expect(await db.charts.count()).toBe(1);
  });

  it('skips corrupt entries without throwing', async () => {
    localStorage.setItem(LEGACY_KEYS.charts, '{not json');
    await openDb();
    await expect(migrateFromLocalStorage()).resolves.toBe(0);
  });
});

describe('backup', () => {
  it('round-trips charts, series, brand (with a blob logo) and settings', async () => {
    await openDb();
    await db.charts.put({ id: 'a', spec: defaultSpec(), createdAt: 1, updatedAt: 2 });
    await db.series.put({ id: 's', chartId: 'a', cadence: 'monthly', nextDue: 3, snapshots: [{ at: 1, rows: defaultSpec().data }] });
    await db.brand.put({ id: 'brand', palette: ['#000000'], safe: false, corner: 'br', applyToNew: true, logo: new Blob(['png-bytes'], { type: 'image/png' }) });
    await db.settings.put({ id: 'settings', handle: 'me' });
    const blob = await exportBackup();
    expect(blob.type).toBe('application/json');

    indexedDB = new IDBFactory();
    await resetDbForTests();
    await openDb();
    const res = await importBackup(blob, 'replace');
    expect(res).toEqual({ charts: 1, series: 1, skipped: 0 });
    expect((await db.charts.get('a'))?.spec.text.title).toBe('Countries');
    const brand = await db.brand.get('brand');
    expect(brand?.logo).toBeInstanceOf(Blob);
    expect(await blobText(brand!.logo!)).toBe('png-bytes');
    expect((await db.settings.get('settings'))?.handle).toBe('me');
  });

  it('merge keeps existing docs and adds new ones', async () => {
    await openDb();
    await db.charts.put({ id: 'keep', spec: defaultSpec(), createdAt: 1, updatedAt: 1 });
    const other = new Blob([JSON.stringify({ version: 1, charts: [{ id: 'new', spec: defaultSpec(), createdAt: 1, updatedAt: 1 }], series: [], brand: null, settings: null })], { type: 'application/json' });
    await importBackup(other, 'merge');
    expect(await db.charts.count()).toBe(2);
  });

  it('rejects invalid JSON and wrong shapes with a BackupError', async () => {
    await openDb();
    await expect(importBackup(new Blob(['nope']), 'replace')).rejects.toBeInstanceOf(BackupError);
    await expect(importBackup(new Blob([JSON.stringify({ hello: 1 })]), 'replace')).rejects.toBeInstanceOf(BackupError);
    expect(await db.charts.count()).toBe(0);
  });
});

describe('backup restore with a bad chart', () => {
  it('skips the invalid chart, restores the rest, and reports the skip', async () => {
    const { defaultSpec: mk } = await import('@/chart/types');
    const good = { id: 'good', spec: mk({ text: { title: 'Good' } }), createdAt: 1, updatedAt: 1 };
    const bad = { id: 'bad', spec: { ...mk(), data: Array.from({ length: 501 }, (_, i) => ({ id: `r${i}`, label: 'x', value: i })) }, createdAt: 1, updatedAt: 1 };
    const blob = new NodeBlob([JSON.stringify({ version: 1, charts: [good, bad], series: [], brand: null, settings: null })], { type: 'application/json' }) as unknown as Blob;
    const res = await importBackup(blob, 'replace');
    expect(res.charts).toBe(1);
    expect(res.skipped).toBe(1);
    expect(await db.charts.get('good')).toBeTruthy();
    expect(await db.charts.get('bad')).toBeUndefined();
  });
});

describe('shareInbox table (v2 schema)', () => {
  it('stores and reads back a pending shared blob', async () => {
    const blob = new NodeBlob(['hello'], { type: 'image/png' }) as unknown as Blob;
    await db.shareInbox.put({ id: 'pending', blob, at: 1234 });
    const doc = await db.shareInbox.get('pending');
    expect(doc?.at).toBe(1234);
    expect(doc?.blob).toBeInstanceOf(NodeBlob);
  });

  it('a second put overwrites the first (only ever one pending share)', async () => {
    await db.shareInbox.put({ id: 'pending', blob: new NodeBlob(['a']) as unknown as Blob, at: 1 });
    await db.shareInbox.put({ id: 'pending', blob: new NodeBlob(['b']) as unknown as Blob, at: 2 });
    expect(await db.shareInbox.count()).toBe(1);
    expect((await db.shareInbox.get('pending'))?.at).toBe(2);
  });
});
