// The chart at true post size, scaled to fit, with optional safe-zone overlays.
import { useLayoutEffect, useRef, useState } from 'react';
import { Chart } from '../../chart/render/Chart';
import { POST_SIZES, type ChartSpec } from '../../chart/types';
import { SAFE_ZONES, type Platform } from '../../chart/safezones';

export interface ArtboardProps { spec: ChartSpec; safeZones: Platform[]; onScale?: (scale: number) => void; fitHeight?: boolean }

export function Artboard({ spec, safeZones, onScale, fitHeight = true }: ArtboardProps): React.JSX.Element {
  const well = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const size = POST_SIZES[spec.size];

  useLayoutEffect(() => {
    const el = well.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = 24;
  const availW = Math.max(0, box.w - pad * 2);
  const availH = Math.max(0, box.h - pad * 2);
  // On phones the well grows with its content, so height must not feed back into the scale.
  const scale = availW > 0 ? (fitHeight && availH > 0 ? Math.min(availW / size.w, availH / size.h, 1) : Math.min(availW / size.w, 1)) : 0.5;
  const width = Math.round(size.w * scale);
  useLayoutEffect(() => { onScale?.(scale); }, [scale, onScale]);

  return (
    <div ref={well} className="cg-artboard-well" role="region" aria-label="Artboard">
      <div className="cg-artboard-card" style={{ width: width || '100%', boxShadow: 'var(--shadow-artboard)' }}>
        <Chart spec={spec} />
        {safeZones.map((p) => {
          const inset = SAFE_ZONES[p].insets[spec.size];
          if (!inset) return null;
          return (
            <div
              key={p}
              className="cg-safezone"
              aria-hidden="true"
              title={`${SAFE_ZONES[p].label} safe zone (as of ${SAFE_ZONES[p].asOf})`}
              style={{ top: `${inset.top * 100}%`, right: `${inset.right * 100}%`, bottom: `${inset.bottom * 100}%`, left: `${inset.left * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
