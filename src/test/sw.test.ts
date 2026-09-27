import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('a share with text but no file still pre-fills the intake screen, storing nothing (Review Focus 5 — regression: this used to redirect to a blank /new?shared=1)', async () => {
    const result = await handleShareTarget(formDataRequest({ text: 'hello' }));
    expect(result.blob).toBeNull();
    expect(result.redirectTo).toBe('/new?text=hello');
    expect(await db.shareInbox.get('pending')).toBeUndefined();
  });

  it('a shared URL redirects with the url field, not shared=1', async () => {
    const result = await handleShareTarget(formDataRequest({ url: 'https://example.com/report' }));
    expect(result.redirectTo).toBe('/new?url=https%3A%2F%2Fexample.com%2Freport');
  });

  it('an image shared alongside a caption keeps both: shared=1 and text', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/png' });
    const result = await handleShareTarget(formDataRequest({ image: blob, text: 'look at this' }));
    expect(result.redirectTo).toBe('/new?text=look+at+this&shared=1');
  });

  it('an empty share (no image, no text, no url) redirects to a bare /new', async () => {
    const result = await handleShareTarget(formDataRequest({}));
    expect(result.redirectTo).toBe('/new');
  });
});

describe('handleShareTarget error handling (review item I2)', () => {
  it('a malformed multipart body still redirects instead of rejecting', async () => {
    const badRequest = new Request('https://chartgenie.xyz/new', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body: 'not actually multipart' });
    const result = await handleShareTarget(badRequest);
    expect(result.redirectTo).toBe('/new');
    expect(result.blob).toBeNull();
  });

  it('a storage failure while saving the image still redirects instead of rejecting', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/png' });
    const putSpy = vi.spyOn(db.shareInbox, 'put').mockRejectedValueOnce(new Error('quota exceeded'));
    const result = await handleShareTarget(formDataRequest({ image: blob }));
    expect(result.redirectTo).toBe('/new');
    putSpy.mockRestore();
  });
});

describe('isShareTargetRequest (review item I2: do not hijack arbitrary POSTs)', () => {
  it('matches a same-origin navigation POST to /new', async () => {
    const { isShareTargetRequest } = await import('@/sw');
    const req = new Request('https://chartgenie.xyz/new', { method: 'POST' });
    expect(isShareTargetRequest(req, 'https://chartgenie.xyz')).toBe(true);
  });

  it('rejects a cross-origin POST to a different host, even to the same path', async () => {
    const { isShareTargetRequest } = await import('@/sw');
    const req = new Request('https://evil.example/new', { method: 'POST' });
    expect(isShareTargetRequest(req, 'https://chartgenie.xyz')).toBe(false);
  });

  it('rejects a GET to /new', async () => {
    const { isShareTargetRequest } = await import('@/sw');
    const req = new Request('https://chartgenie.xyz/new', { method: 'GET' });
    expect(isShareTargetRequest(req, 'https://chartgenie.xyz')).toBe(false);
  });

  it('rejects a POST to a different path', async () => {
    const { isShareTargetRequest } = await import('@/sw');
    const req = new Request('https://chartgenie.xyz/edit/x', { method: 'POST' });
    expect(isShareTargetRequest(req, 'https://chartgenie.xyz')).toBe(false);
  });
});
