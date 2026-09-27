// The live artboard: our frame as an SVG, with a real ECharts instance mounted
// over the plot box so editing stays instant. Export never screenshots this;
// it goes through svgString(), which draws the identical thing.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChartSpec } from '../types';
import { frame } from '../frame';
import { canvasMeasurer } from '../measure';
import { echarts, installMeasurer } from '../echarts';
import { plotContext } from '../plots';
import { textBoxes } from './parse';
import { placeCallouts } from './callouts';
import { plotSvg, buildOrRefuse } from './plotSvg';
import { compose } from './compose';
import { LOOKS } from '../types';

export interface ChartProps { spec: ChartSpec; className?: string; onReady?: () => void; static?: boolean }

export function Chart({ spec, className, onReady, static: isStatic }: ChartProps): React.JSX.Element {
  const measure = useMemo(() => canvasMeasurer(), []);
  const f = useMemo(() => frame(spec, measure), [spec, measure]);
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / f.w));
    ro.observe(el);
    setScale(el.clientWidth / f.w);
    return () => ro.disconnect();
  }, [f.w]);

  useEffect(() => {
    if (isStatic || !host.current) return;
    installMeasurer(measure);
    if (!inst.current) inst.current = echarts.init(host.current, null, { renderer: 'svg', width: f.plot.w, height: f.plot.h });
    inst.current.resize({ width: f.plot.w, height: f.plot.h });
    inst.current.setOption(buildOrRefuse(spec, plotContext(spec, f, measure)), { notMerge: true, lazyUpdate: false });
    onReady?.();
  }, [spec, f, measure, isStatic, onReady]);

  useEffect(() => () => { inst.current?.dispose(); inst.current = null; }, []);

  // The frame (and callouts) are drawn from the same code path as export. Live mode
  // draws the frame below the ECharts instance and the callouts above it.
  const { overlay, above } = useMemo(() => {
    const plot = isStatic ? plotSvg(spec, f, measure) : '';
    const callouts = spec.callouts.length ? placeCallouts(spec, f, textBoxes(isStatic ? plot : plotSvg(spec, f, measure), f.plot, measure), measure) : [];
    return {
      overlay: compose(spec, f, plot, isStatic ? callouts : []),
      above: !isStatic && callouts.length ? compose(spec, f, '', callouts, { only: 'callouts' }) : '',
    };
  }, [spec, f, measure, isStatic]);

  const look = LOOKS[spec.look];
  return (
    <div ref={wrap} className={`cg-artboard ${className ?? ''}`} style={{ position: 'relative', width: '100%', aspectRatio: `${f.w} / ${f.h}`, background: look.bg, overflow: 'hidden' }}>
      <div
        className="cg-frame-host"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{ __html: overlay.replace('<svg ', '<svg class="cg-frame" style="width:100%;height:100%;display:block" ') }}
      />
      {!isStatic && (
        <div
          ref={host}
          className="cg-plot"
          style={{ position: 'absolute', left: f.plot.x * scale, top: f.plot.y * scale, width: f.plot.w, height: f.plot.h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
      )}
      {above && (
        <div
          className="cg-callouts-host"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          dangerouslySetInnerHTML={{ __html: above.replace('<svg ', '<svg class="cg-callouts" style="width:100%;height:100%;display:block" ') }}
        />
      )}
    </div>
  );
}
