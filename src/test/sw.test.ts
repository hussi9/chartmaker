import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { db, openDb, resetDbForTests } from '@/db';
import { handleShareTarget } from '@/sw';

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
});

function formDataRequest(fields: Record<string, string | Blob>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request('https://chartgenie.xyz/new', { method: 'POST', body: fd });
}

describe('handleShareTarget', () => {
  it('stores the shared image and redirects to /new?shared=1', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/png' });
    const result = await handleShareTarget(formDataRequest({ image: blob }));
    expect(result.redirectTo).toBe('/new?shared=1');
    expect(result.blob).not.toBeNull();
    const stored = await db.shareInbox.get('pending');
    expect(stored?.blob).toBeTruthy();
  });

  it('a share with text but no file still redirects, storing nothing (Review Focus 5)', async () => {
    const result = await handleShareTarget(formDataRequest({ text: 'hello' }));
    expect(result.blob).toBeNull();
    expect(result.redirectTo).toBe('/new?shared=1');
    expect(await db.shareInbox.get('pending')).toBeUndefined();
  });
});
