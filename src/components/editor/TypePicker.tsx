// "Conversion Funnel ▾": a dialog listing every look, disabled with a reason
// when the current rows cannot use it.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CHART_TYPES, type ChartType, type Row } from '../../chart/types';
import { PLOTS, type PlotCategory } from '../../chart/plots';
import { Button } from '../common/Button';
import { Chip } from '../common/Chip';

const CATEGORIES: { id: PlotCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'bars', label: 'Bars' }, { id: 'trends', label: 'Trends' }, { id: 'compare', label: 'Compare' },
  { id: 'kpis', label: 'KPIs' }, { id: 'funnels', label: 'Funnels' }, { id: 'matrix', label: 'Matrix' },
];

export interface TypePickerProps { type: ChartType; rows: Row[]; onChange: (t: ChartType) => void }

export function TypePicker({ type, rows, onChange }: TypePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<PlotCategory | 'all'>('all');
  const dialog = useRef<HTMLDivElement>(null);
  const list = useMemo(() => CHART_TYPES.filter((t) => cat === 'all' || PLOTS[t].category === cat), [cat]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    dialog.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Change chart type (currently ${PLOTS[type].name})`} icon={<ChevronDown size={14} />}>
        {PLOTS[type].name}
      </Button>
      {open && (
        <div className="cg-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={dialog} className="cg-dialog cg-typepicker" role="dialog" aria-modal="true" aria-label="Chart type">
            <div className="cg-typepicker-head">
              <h2 className="cg-dialog-title">Pick a look</h2>
              <span className="cg-mono">{CHART_TYPES.length} looks</span>
            </div>
            <div className="cg-chips">
              {CATEGORIES.map((c) => <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>)}
            </div>
            <div className="cg-typepicker-grid" role="listbox" aria-label="Chart types">
              {list.map((t) => {
                const def = PLOTS[t];
                const ok = def.accepts(rows);
                return (
                  <button
                    key={t}
                    type="button"
                    role="option"
                    aria-selected={t === type}
                    aria-disabled={!ok.ok}
                    className="cg-typepicker-opt"
                    data-on={t === type ? 'true' : undefined}
                    onClick={() => { if (ok.ok) { onChange(t); setOpen(false); } }}
                  >
                    <span className="cg-typepicker-name">{def.name}</span>
                    <span className="cg-typepicker-blurb">{ok.ok ? def.blurb : ok.reason}</span>
                  </button>
                );
              })}
            </div>
            <div className="cg-dialog-actions"><Button variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
