import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { Series } from '@/components/series/Series';
import { createSeries, nextDueAfter, applyUpdate, skip, dueSeries } from '@/db/series';
import { defaultSpec } from '@/chart/types';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { db, openDb, resetDbForTests } from '@/db';

globalThis.Blob = NodeBlob as unknown as typeof Blob;

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

const DAY = 86_400_000;

function mount(path = '/series') {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const series = createRoute({ getParentRoute: () => rootRoute, path: '/series', component: () => <Series /> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', validateSearch: (s: Record<string, unknown>) => ({ export: typeof s.export === 'string' ? s.export : undefined }), component: () => <div>Editor page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([series, edit]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false, toasts: [] });
  useDoc.getState().reset();
  await db.charts.put({ id: 'mrr', spec: defaultSpec({ text: { title: 'MRR by plan' }, data: [{ id: 'a', label: 'Starter', value: 12 }, { id: 'b', label: 'Pro', value: 20 }, { id: 'c', label: 'Team', value: 8 }] }), createdAt: 1, updatedAt: 1 });
});

describe('nextDueAfter', () => {
  it('monthly from Jan 31 lands on the last day of February', () => {
    const from = Date.UTC(2026, 0, 31, 12);
    const d = new Date(nextDueAfter(from, 'monthly'));
    expect([d.getUTCMonth(), d.getUTCDate()]).toEqual([1, 28]);
  });
  it('weekly adds seven days; quarterly adds three months', () => {
    const from = Date.UTC(2026, 2, 1, 12);
    expect(nextDueAfter(from, 'weekly') - from).toBe(7 * DAY);
    expect(new Date(nextDueAfter(from, 'quarterly')).getUTCMonth()).toBe(5);
  });
});

describe('series storage', () => {
  it('createSeries sets the first due date one period ahead', async () => {
    const s = await createSeries('mrr', 'monthly');
    expect(s.chartId).toBe('mrr');
    expect(s.nextDue).toBeGreaterThan(Date.now() + 27 * DAY);
    expect(s.snapshots).toEqual([]);
  });

  it('applyUpdate snapshots the old rows, sets the ghost, writes the new rows and advances', async () => {
    const s = await createSeries('mrr', 'monthly');
    await db.series.update(s.id, { nextDue: Date.now() - DAY });
    const r = await applyUpdate(s.id, [{ id: 'x', label: 'Starter', value: 15 }, { id: 'y', label: 'Pro', value: 26 }, { id: 'z', label: 'Team', value: 11 }]);
    expect(r).toEqual({ chartId: 'mrr', unmatched: [] });
    const chart = (await db.charts.get('mrr'))!;
    expect(chart.spec.data.map((d) => d.value)).toEqual([15, 26, 11]);
    expect(chart.spec.options.ghost?.map((d) => d.value)).toEqual([12, 20, 8]);
    const after = (await db.series.get(s.id))!;
    expect(after.snapshots).toHaveLength(1);
    expect(after.snapshots[0].rows.map((d) => d.value)).toEqual([12, 20, 8]);
    expect(after.nextDue).toBeGreaterThan(Date.now());
  });

  it('applyUpdate matches by label and reports unmatched labels', async () => {
    const s = await createSeries('mrr', 'monthly');
    const r = await applyUpdate(s.id, [{ id: 'x', label: 'Pro', value: 30 }, { id: 'y', label: 'Teem', value: 9 }]);
    expect(r.unmatched).toEqual(['Teem']);
    const chart = (await db.charts.get('mrr'))!;
    expect(chart.spec.data.map((d) => d.value)).toEqual([12, 30, 8]);
  });

  it('skip only advances the due date; dueSeries lists what is due', async () => {
    const s = await createSeries('mrr', 'weekly');
    await db.series.update(s.id, { nextDue: Date.now() - DAY });
    expect((await dueSeries()).map((x) => x.id)).toEqual([s.id]);
    await skip(s.id);
    expect(await dueSeries()).toEqual([]);
    expect((await db.series.get(s.id))!.snapshots).toEqual([]);
  });
});

describe('Series screen', () => {
  it('shows the empty state and creates a series from a saved chart', async () => {
    const user = userEvent.setup();
    mount();
    expect(await screen.findByText(/no recurring charts yet/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /new series/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /new series/i });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /chart/i }), 'mrr');
    await user.click(within(dialog).getByRole('radio', { name: /monthly/i }));
    await user.click(within(dialog).getByRole('button', { name: /create/i }));
    await waitFor(() => expect(screen.getByText('MRR by plan')).toBeInTheDocument());
    expect(screen.getByText(/^next /i)).toBeInTheDocument();
    expect(screen.getByText(/due dates show in the app/i)).toBeInTheDocument();
  });

  it('a due series shows Due, accepts pasted values by label and warns on a miss', async () => {
    const user = userEvent.setup();
    const s = await createSeries('mrr', 'monthly');
    await db.series.update(s.id, { nextDue: Date.now() - DAY });
    mount();
    const card = await screen.findByRole('article', { name: /MRR by plan/ });
    expect(within(card).getByText('Due')).toBeInTheDocument();
    await user.click(within(card).getByRole('textbox', { name: /new values/i }));
    await user.paste('Starter 15\nPro 26\nTeem 11');
    expect(await within(card).findByText(/Not in this chart: Teem/)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: /update & export set/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect((await db.charts.get('mrr'))!.spec.data.map((d) => d.value)).toEqual([15, 26, 8]);
  });

  it('Skip advances the date without changing the chart', async () => {
    const user = userEvent.setup();
    const s = await createSeries('mrr', 'monthly');
    await db.series.update(s.id, { nextDue: Date.now() - DAY });
    mount();
    const card = await screen.findByRole('article', { name: /MRR by plan/ });
    await user.click(within(card).getByRole('button', { name: /skip/i }));
    await waitFor(() => expect(within(card).queryByText('Due')).toBeNull());
    expect((await db.charts.get('mrr'))!.spec.data.map((d) => d.value)).toEqual([12, 20, 8]);
  });
});

describe('notifyDue', () => {
  it('notifies once per due date when permission is granted, and never without it', async () => {
    const { notifyDue } = await import('@/db/series');
    const created: string[] = [];
    class FakeNotification { static permission = 'granted'; constructor(title: string) { created.push(title); } }
    (globalThis as { Notification?: unknown }).Notification = FakeNotification;
    const s = await createSeries('mrr', 'monthly');
    await db.series.update(s.id, { nextDue: Date.now() - DAY });
    expect(await notifyDue()).toBe(1);
    expect(created).toEqual(['MRR by plan is due']);
    expect(await notifyDue()).toBe(0);
    FakeNotification.permission = 'default';
    await db.series.update(s.id, { notifiedAt: undefined });
    expect(await notifyDue()).toBe(0);
    delete (globalThis as { Notification?: unknown }).Notification;
  });
});
