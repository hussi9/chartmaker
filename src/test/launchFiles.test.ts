import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { db, openDb, resetDbForTests } from '@/db';
import { handleLaunchFile } from '@/lib/launchFiles';

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
});

describe('handleLaunchFile (review item C4 — "Open with ChartGenie" on a photo)', () => {
  it('an image file is stored in shareInbox and routed through the same hydration path as a real OS share', async () => {
    const file = new File(['fake png bytes'], 'photo.png', { type: 'image/png' });
    const result = await handleLaunchFile(file);
    expect(result.search).toEqual({ shared: true });
    const stored = await db.shareInbox.get('pending');
    expect(stored?.blob).toBeTruthy();
  });

  it('a .csv file is read as text and returned for the existing paste-box prefill, untouched by this branch', async () => {
    const file = new File(['USA,87\nItaly,20'], 'data.csv', { type: 'text/csv' });
    const result = await handleLaunchFile(file);
    expect(result.search).toEqual({ text: 'USA,87\nItaly,20' });
    expect(await db.shareInbox.get('pending')).toBeUndefined();
  });

  it('a launched text file longer than 20,000 characters is truncated, matching the pre-existing behavior', async () => {
    const long = 'x'.repeat(25_000);
    const file = new File([long], 'big.csv', { type: 'text/csv' });
    const result = await handleLaunchFile(file);
    expect(result.search).toEqual({ text: 'x'.repeat(20_000) });
  });
});
