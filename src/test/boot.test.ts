import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, openDb, resetDbForTests } from '@/db';
import { useUi } from '@/store/ui';

// Review item 4: storage that opens but then fails (quota, private mode) must not take every route down.
beforeEach(async () => { await resetDbForTests(); await openDb(); useUi.setState({ storage: 'ok' }); });

describe('boot', () => {
  it('resolves and marks storage unavailable when a post-open read throws', async () => {
    const { boot, resetBootForTests } = await import('@/lib/boot');
    resetBootForTests();
    const spy = vi.spyOn(db.settings, 'get').mockRejectedValueOnce(new Error('QuotaExceededError'));
    await expect(boot()).resolves.toBeUndefined();
    expect(useUi.getState().storage).toBe('unavailable');
    spy.mockRestore();
  });
  it('does not cache a failed boot', async () => {
    const { boot, resetBootForTests } = await import('@/lib/boot');
    resetBootForTests();
    const spy = vi.spyOn(db.settings, 'get').mockRejectedValueOnce(new Error('boom'));
    await boot();
    spy.mockRestore();
    useUi.setState({ storage: 'ok' });
    await boot();
    expect(useUi.getState().storage).toBe('ok');
  });
});
