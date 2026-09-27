import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { db, openDb, resetDbForTests } from '@/db';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';

globalThis.Blob = NodeBlob as unknown as typeof Blob;

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  useDoc.getState().reset();
  useDoc.temporal.getState().clear();
  useUi.setState({ storage: 'ok', toasts: [] });
});

describe('document store', () => {
  it('newDoc creates a spec and setSpec is undoable', () => {
    const id = useDoc.getState().newDoc();
    expect(id).toMatch(/^c_/);
    expect(useDoc.getState().spec.text.title).toBe('Countries');
    useDoc.getState().setSpec((d) => { d.text.title = 'Renamed'; });
    expect(useDoc.getState().spec.text.title).toBe('Renamed');
    useDoc.temporal.getState().undo();
    expect(useDoc.getState().spec.text.title).toBe('Countries');
    useDoc.temporal.getState().redo();
    expect(useDoc.getState().spec.text.title).toBe('Renamed');
  });

  it('setRows replaces the data and marks the doc dirty', () => {
    useDoc.getState().newDoc();
    useDoc.getState().setRows([{ id: 'a', label: 'A', value: 1 }]);
    expect(useDoc.getState().spec.data).toHaveLength(1);
    expect(useDoc.getState().dirty).toBe(true);
  });

  it('save() persists the doc with a thumbnail when storage is ok', async () => {
    await openDb();
    useUi.setState({ storage: 'ok' });
    const id = useDoc.getState().newDoc();
    await useDoc.getState().save();
    expect(useDoc.getState().saveState).toBe('saved');
    const doc = await db.charts.get(id);
    expect(doc?.spec.text.title).toBe('Countries');
    expect(doc?.thumb).toBeDefined();
    expect(doc?.thumb?.type).toBe('image/svg+xml');
  });

  it('save() reports unavailable and does not throw without storage', async () => {
    useUi.setState({ storage: 'unavailable' });
    useDoc.getState().newDoc();
    await expect(useDoc.getState().save()).resolves.toBeUndefined();
    expect(useDoc.getState().saveState).toBe('unavailable');
  });

  it('load() returns false for an unknown id and true for a saved one', async () => {
    await openDb();
    const id = useDoc.getState().newDoc();
    await useDoc.getState().save();
    useDoc.getState().reset();
    expect(await useDoc.getState().load('nope')).toBe(false);
    expect(await useDoc.getState().load(id)).toBe(true);
    expect(useDoc.getState().id).toBe(id);
  });

  it('duplicate() saves a copy titled "<title> copy" and switches to it', async () => {
    await openDb();
    const id = useDoc.getState().newDoc();
    await useDoc.getState().save();
    const copy = await useDoc.getState().duplicate();
    expect(copy).not.toBe(id);
    expect(useDoc.getState().id).toBe(copy);
    expect((await db.charts.get(copy))?.spec.text.title).toBe('Countries copy');
    expect(await db.charts.count()).toBe(2);
  });

  it('autosaves shortly after an edit without an explicit save()', async () => {
    await openDb();
    const id = useDoc.getState().newDoc();
    useDoc.getState().setSpec((d) => { d.text.title = 'Auto'; });
    expect(useDoc.getState().saveState).toBe('saving');
    await vi.waitFor(async () => expect((await db.charts.get(id))?.spec.text.title).toBe('Auto'), { timeout: 2000, interval: 50 });
    expect(useDoc.getState().saveState).toBe('saved');
  });
});

describe('ui store', () => {
  it('toast() queues a message and dismiss removes it', () => {
    useUi.getState().toast('Saved');
    expect(useUi.getState().toasts.map((t) => t.message)).toEqual(['Saved']);
    useUi.getState().dismiss(useUi.getState().toasts[0].id);
    expect(useUi.getState().toasts).toEqual([]);
  });

  it('starts on the insights tab with X selected for safe zones', () => {
    expect(useUi.getState().rightTab).toBe('insights');
    expect(useUi.getState().safeZones).toEqual(['x']);
    expect(useUi.getState().exportSizes).toEqual(['16:9', '1:1', '9:16']);
  });
});

describe('row limit', () => {
  it('caps rows at 500 in the store and tells the person', async () => {
    useDoc.getState().newDoc();
    useDoc.getState().setRows(Array.from({ length: 600 }, (_, i) => ({ id: `r${i}`, label: `Row ${i}`, value: i })));
    expect(useDoc.getState().spec.data.length).toBe(500);
    expect(useUi.getState().toasts.some((t) => /500 rows/.test(t.message))).toBe(true);
  });
});

describe('undo and autosave (review item 5)', () => {
  it('an undo is autosaved like any other edit', async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const id = useDoc.getState().newDoc({ text: { title: 'A' } });
    useDoc.getState().setSpec((d) => { d.text.title = 'B'; });
    await sleep(700);
    expect((await db.charts.get(id))?.spec.text.title).toBe('B');
    useDoc.temporal.getState().undo();
    expect(useDoc.getState().spec.text.title).toBe('A');
    expect(useDoc.getState().saveState).toBe('saving');
    await sleep(700);
    expect((await db.charts.get(id))?.spec.text.title).toBe('A');
  });
});

describe('load failures (review item 15)', () => {
  it('returns false instead of rejecting when storage throws', async () => {
    const spy = vi.spyOn(db.charts, 'get').mockRejectedValueOnce(new Error('boom'));
    await expect(useDoc.getState().load('x')).resolves.toBe(false);
    spy.mockRestore();
  });
});

describe('undo stack hygiene', () => {
  it('a completed autosave does not become an undo step', async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    useDoc.getState().newDoc({ text: { title: 'A' } });
    useDoc.getState().setSpec((d) => { d.text.title = 'B'; });
    await sleep(700); // autosave ran and wrote saveState: 'saved'
    expect(useDoc.temporal.getState().pastStates).toHaveLength(1);
    useDoc.temporal.getState().undo();
    expect(useDoc.getState().spec.text.title).toBe('A');
  });
});
