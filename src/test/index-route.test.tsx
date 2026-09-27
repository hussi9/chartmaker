import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
