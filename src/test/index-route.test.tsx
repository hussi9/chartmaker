import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRouter, createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { db, openDb, resetDbForTests } from '@/db';
import { useUi } from '@/store/ui';
import { defaultSpec } from '@/chart/types';

// This mounts the REAL router (routeTree.gen.ts) with a REAL query-string history
// entry, exactly as a hard navigation or a `Link to="/?templates=1"` click produces.
// Component-level tests elsewhere build their own stub route trees and pass typed
// search objects, which never exercises the router's own query-string parser —
// that parser is where this regression lived (it hands validateSearch a NUMBER for
// `?templates=1`, not the string '1', so the templates bypass never matched and a
// returning visitor was bounced straight to /new).
vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

beforeEach(async () => {
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false });
});

function mount(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

describe('the real "/" route with a real query string', () => {
  it('shows the templates gallery for /?templates=1 even when a chart is already saved', async () => {
    await db.charts.put({ id: 'c1', spec: defaultSpec(), createdAt: 1, updatedAt: 1 });
    mount('/?templates=1');
    expect(await screen.findByRole('heading', { name: /pick a look/i })).toBeInTheDocument();
  });

  it('still redirects a returning visitor away from a bare "/"', async () => {
    await db.charts.put({ id: 'c1', spec: defaultSpec(), createdAt: 1, updatedAt: 1 });
    mount('/');
    expect(await screen.findByText(/paste anything/i)).toBeInTheDocument();
  });

  it('the Templates nav link (a raw "/?templates=1" href, like Link and a real click produce) reaches the gallery', async () => {
    await db.charts.put({ id: 'c1', spec: defaultSpec(), createdAt: 1, updatedAt: 1 });
    mount('/charts');
    const link = await screen.findByRole('link', { name: 'Templates' });
    expect(link).toHaveAttribute('href', '/?templates=1');
    link.click();
    expect(await screen.findByRole('heading', { name: /pick a look/i })).toBeInTheDocument();
  });
});

describe('the real "/new" route with a real query string (same bug class)', () => {
  it('prefills shared text that happens to look numeric, boolean, or decimal', async () => {
    mount('/new?text=2024');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('2024');
  });

  it('prefills shared text that is literally "true" or "false"', async () => {
    mount('/new?text=true');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('true');
  });
});

describe('a shared picture is picked up from shareInbox (review item: share with no file)', () => {
  it('reads and clears the pending blob when /new?shared=1 loads', async () => {
    const { db } = await import('@/db');
    const blob = new Blob(['x'], { type: 'image/png' });
    await db.shareInbox.put({ id: 'pending', blob, at: Date.now() });
    mount('/new?shared=1');
    await screen.findByLabelText('Paste your numbers');
    await waitFor(async () => expect(await db.shareInbox.get('pending')).toBeUndefined());
  });

  it('is a silent no-op when nothing is pending', async () => {
    mount('/new?shared=1');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('');
  });

  it('/new?text=hello still works exactly as before (no file field required)', async () => {
    mount('/new?text=hello');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('hello');
  });
});
