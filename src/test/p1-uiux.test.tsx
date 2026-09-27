import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toPng, toSvg } from 'html-to-image';
import { ChartCanvas } from '../components/ChartCanvas';
import { ExportModal } from '../components/ExportModal';
import { App } from '../App';
import { COLOR_SCHEMES } from '../lib/chartPresets';
import { includeInChartExport } from '../lib/chartExport';
import type { CanvasThemeMode } from '../lib/chartPresets';

vi.mock('html-to-image', () => ({ toPng: vi.fn(), toSvg: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('chart supporting text across exported canvas modes', () => {
  it.each([
    ['light', '#0f172a'],
    ['paper', '#2f3437'],
    ['dark', '#f8fafc'],
    ['spotify', '#ffffff'],
    ['pure-dark', '#ffffff'],
    ['slate', '#f8fafc']
  ] as [CanvasThemeMode, string][])('uses canvas text color for the %s callout', (bgMode, expectedColor) => {
    const canvasRef = { current: null as HTMLDivElement | null };
    render(
      <ChartCanvas
        data={[{ id: '1', name: 'Chrome', value: 65 }, { id: '2', name: 'Safari', value: 35 }]}
        chartType="funnel"
        scheme={COLOR_SCHEMES[0]}
        title="Category share"
        subtitle=""
        calloutMetric="Chrome leads at 65%"
        showLegend
        showValues
        is3d={false}
        aspectRatio="16:9"
        fontFamily="Plus Jakarta Sans"
        bgMode={bgMode}
        canvasRef={canvasRef}
      />
    );

    const callout = screen.getByText(/Chrome leads at 65%/);
    expect(callout).toHaveStyle({ color: expectedColor });
    expect(canvasRef.current?.contains(callout)).toBe(true);
  });
});

describe('recoverable export failures', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('shows PNG generation failure in the modal and clears it after a successful retry', async () => {
    const notify = vi.fn();
    vi.mocked(toPng).mockRejectedValueOnce(new Error('render failed')).mockResolvedValueOnce('data:image/png;base64,AAAA');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<ExportModal isOpen onClose={() => {}} canvasRef={{ current: document.createElement('div') }} chartTitle="Test" onNotify={notify} />);

    const png = screen.getByRole('button', { name: /High-Res PNG \(Retina 2x\)/i });
    fireEvent.click(png);
    expect(await screen.findByRole('alert')).toHaveTextContent(/PNG export failed.*try again/i);
    expect(png).toBeEnabled();
    expect(notify).not.toHaveBeenCalledWith(expect.stringMatching(/downloaded/i), expect.anything());

    fireEvent.click(png);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Downloaded 2x PNG!', 'success'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows SVG generation failure and leaves an alternate PNG download available', async () => {
    vi.mocked(toSvg).mockRejectedValueOnce(new Error('render failed'));
    render(<ExportModal isOpen onClose={() => {}} canvasRef={{ current: document.createElement('div') }} chartTitle="Test" />);

    fireEvent.click(screen.getByRole('button', { name: /Download Vector SVG/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/SVG export failed.*try again/i);
    expect(screen.getByRole('button', { name: /High-Res PNG \(Retina 2x\)/i })).toBeEnabled();
  });

  it('explains when the chart preview is not ready for download', async () => {
    render(<ExportModal isOpen onClose={() => {}} canvasRef={{ current: null }} chartTitle="Test" />);

    fireEvent.click(screen.getByRole('button', { name: /High-Res PNG \(Retina 2x\)/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/preview is not ready/i);
  });
});

describe('chart image export boundary', () => {
  it('keeps text nodes when the image renderer filters child nodes', () => {
    const label = document.createTextNode('Chrome');
    expect((includeInChartExport as (node: Node) => boolean)(label)).toBe(true);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,AAAA');
    vi.mocked(toSvg).mockResolvedValue('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('keeps footer actions on screen but excludes them from PNG and SVG clones', async () => {
    const canvasRef = { current: null as HTMLDivElement | null };
    render(
      <>
        <ChartCanvas
          data={[{ id: '1', name: 'Chrome', value: 65 }, { id: '2', name: 'Safari', value: 35 }]}
          chartType="funnel"
          scheme={COLOR_SCHEMES[0]}
          title="Category share"
          subtitle=""
          showLegend
          showValues
          is3d={false}
          aspectRatio="16:9"
          fontFamily="Plus Jakarta Sans"
          bgMode="dark"
          canvasRef={canvasRef}
          onGetShareLink={() => {}}
          onDownload={() => {}}
        />
        <ExportModal isOpen onClose={() => {}} canvasRef={canvasRef} chartTitle="Category share" />
      </>
    );

    const shareButton = screen.getByRole('button', { name: 'Get share link' });
    const downloadButton = screen.getByRole('button', { name: /Download ▾/ });
    const actionGroup = shareButton.parentElement!;
    expect(canvasRef.current?.contains(shareButton)).toBe(true);
    expect(canvasRef.current?.contains(downloadButton)).toBe(true);
    expect(actionGroup).toHaveAttribute('data-chart-export-exclude');

    fireEvent.click(screen.getByRole('button', { name: /High-Res PNG \(Retina 2x\)/i }));
    await waitFor(() => expect(toPng).toHaveBeenCalled());
    const pngFilter = vi.mocked(toPng).mock.calls[0][1]?.filter;
    expect(pngFilter?.(actionGroup)).toBe(false);
    expect(pngFilter?.(canvasRef.current!)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Download Vector SVG/i }));
    await waitFor(() => expect(toSvg).toHaveBeenCalled());
    const svgFilter = vi.mocked(toSvg).mock.calls[0][1]?.filter;
    expect(svgFilter?.(actionGroup)).toBe(false);
    expect(svgFilter?.(canvasRef.current!)).toBe(true);
  });

  it('applies the same exclusion to the canvas Copy PNG shortcut', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy PNG' }));
    await waitFor(() => expect(toPng).toHaveBeenCalled());

    const [canvas, options] = vi.mocked(toPng).mock.calls[0];
    const actionGroup = canvas.querySelector('[data-chart-export-exclude]');
    expect(actionGroup).not.toBeNull();
    expect(options?.filter?.(actionGroup as HTMLElement)).toBe(false);
  });
});

describe('every export entry uses the immediately updated canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,AAAA');
    vi.mocked(toSvg).mockResolvedValue('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['png'], { type: 'image/png' }) }));
    vi.stubGlobal('ClipboardItem', class {
      items: Record<string, Blob>;
      constructor(items: Record<string, Blob>) { this.items = items; }
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator.clipboard, 'write', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator.clipboard, 'write');
  });

  it.each([
    [/High-Res PNG \(Retina 2x\)/i, 'png'],
    [/High-resolution 4x PNG/i, 'png'],
    [/Download Vector SVG/i, 'svg'],
    [/Copy Image to Clipboard/i, 'png'],
    [/Copy Vector SVG for Figma/i, 'svg'],
    [/Native Share Sheet/i, 'png'],
  ] as const)('captures the edited state using %s', async (action, format) => {
    const canvasRef = { current: null as HTMLDivElement | null };
    const editor = (edited: boolean) => <>
      <ChartCanvas data={[{ id: 'a', name: 'A', value: edited ? 80 : 20 }, { id: 'b', name: 'B', value: 20 }]}
        chartType="funnel" scheme={COLOR_SCHEMES[0]} title={edited ? 'Edited chart' : 'Original chart'} subtitle=""
        showLegend showValues is3d={edited} aspectRatio={edited ? '9:16' : '16:9'} fontFamily="Inter"
        bgMode={edited ? 'light' : 'dark'} canvasRef={canvasRef} />
      <ExportModal isOpen onClose={() => {}} canvasRef={canvasRef} chartTitle="Edited chart" />
    </>;
    const view = render(editor(false));
    view.rerender(editor(true));
    const renderer = format === 'png' ? toPng : toSvg;
    let captured = false;
    vi.mocked(renderer).mockImplementationOnce(async node => {
      expect(node).toBe(canvasRef.current);
      expect(node).toHaveTextContent('Edited chart');
      expect(node).toHaveTextContent('80');
      expect(node).toHaveStyle({ color: '#0f172a' });
      [node, ...node.querySelectorAll<HTMLElement>('[style]')].forEach(element => {
        expect(['', 'none']).toContain(element.style.transition);
      });
      captured = true;
      return format === 'png' ? 'data:image/png;base64,AAAA' : 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E';
    });
    fireEvent.click(screen.getByRole('button', { name: action }));
    await waitFor(() => expect(captured).toBe(true));
  });
});
