import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { Editor } from '@/components/editor/Editor';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { openDb } from '@/db';

// Headless ECharts stays real; the DOM-mounted artboard instance is faked in jsdom.
vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

function mount(path = `/edit/${useDoc.getState().id}`) {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', component: () => <Editor /> });
  const idx = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <div>Templates page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([idx, edit]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false, rightTab: 'style', safeZones: ['x'], exportSizes: ['16:9', '1:1', '9:16'] });
  useDoc.getState().reset();
  useDoc.getState().newDoc();
  useDoc.temporal.getState().clear();
});

describe('Editor', () => {
  it('shows the three columns, the artboard and the breadcrumb', async () => {
    mount();
    expect(await screen.findByRole('region', { name: /data/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /artboard/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /style/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Countries');
    expect(document.querySelector('.cg-artboard svg.cg-frame')).not.toBeNull();
  });

  it('size chips change the post size and the readout', async () => {
    const user = userEvent.setup();
    mount();
    const sizes = await screen.findByRole('group', { name: /post size/i });
    await user.click(within(sizes).getByRole('button', { name: /1:1/ }));
    expect(useDoc.getState().spec.size).toBe('1:1');
    expect(screen.getByText(/1080 × 1080/)).toBeInTheDocument();
  });

  it('look chips change the look and undo restores it', async () => {
    const user = userEvent.setup();
    mount();
    const looks = await screen.findByRole('group', { name: /look/i });
    await user.click(within(looks).getByRole('button', { name: 'Dark' }));
    expect(useDoc.getState().spec.look).toBe('dark');
    expect(document.querySelector('.cg-artboard')).toHaveStyle({ background: '#1e293b' });
    await user.keyboard('{Meta>}z{/Meta}');
    expect(useDoc.getState().spec.look).toBe('clean');
  });

  it('the type picker lists all 19 looks and switches the type', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: /^Bars ▾$|change chart type/i }));
    const picker = screen.getByRole('dialog', { name: /chart type/i });
    expect(within(picker).getAllByRole('option')).toHaveLength(19);
    await user.click(within(picker).getByRole('option', { name: /Conversion Funnel/ }));
    expect(useDoc.getState().spec.type).toBe('funnel');
  });

  it('the type picker disables a type the data cannot use and says why', async () => {
    const user = userEvent.setup();
    useDoc.getState().setRows([{ id: 'a', label: 'a', value: -5 }, { id: 'b', label: 'b', value: 3 }]);
    mount();
    await user.click(await screen.findByRole('button', { name: /change chart type/i }));
    const funnel = within(screen.getByRole('dialog', { name: /chart type/i })).getByRole('option', { name: /Conversion Funnel/ });
    expect(funnel).toHaveAttribute('aria-disabled', 'true');
    expect(funnel).toHaveTextContent(/values ≥ 0/);
  });

  it('style panel: palette, values, legend, grid, rule, depth, handle', async () => {
    const user = userEvent.setup();
    mount();
    const style = await screen.findByRole('region', { name: /style/i });
    await user.click(within(style).getByRole('radio', { name: 'Number' }));
    expect(useDoc.getState().spec.values).toBe('number');
    await user.click(within(style).getByRole('switch', { name: /legend/i }));
    expect(useDoc.getState().spec.options.legend).toBe(true);
    await user.click(within(style).getByRole('switch', { name: /depth/i }));
    expect(useDoc.getState().spec.options.depth).toBe(true);
    await user.click(within(style).getByRole('radio', { name: /average/i }));
    expect(useDoc.getState().spec.options.rule).toEqual({ kind: 'avg' });
    await user.click(within(style).getByRole('button', { name: /palette slate/i }));
    expect(useDoc.getState().spec.palette[0]).toBe('#1e293b');
    await user.click(within(style).getByRole('switch', { name: /show my handle/i }));
    await user.type(within(style).getByRole('textbox', { name: /handle/i }), 'ada');
    expect(useDoc.getState().spec.options).toMatchObject({ showHandle: true, handle: 'ada' });
    await waitFor(() => expect(useUi.getState().handle).toBe('ada'));
  });

  it('shows Post-ready ✓ for the sample and the autosave dot', async () => {
    mount();
    expect(await screen.findByText(/Post-ready/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Autosaved|Saving/)).toBeInTheDocument());
  });

  it('redirects to / when the id is unknown', async () => {
    useUi.setState({ storage: 'ok' });
    useDoc.getState().reset();
    mount('/edit/does-not-exist');
    expect(await screen.findByText('Templates page')).toBeInTheDocument();
  });
});
