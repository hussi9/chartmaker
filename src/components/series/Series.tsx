// Recurring charts: paste next period's numbers, keep the look, see last time faded behind.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, type LinkProps } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { db, type ChartDoc, type SeriesDoc } from '../../db';
import { createSeries, listSeries, applyUpdate, skip, deleteSeries, notifyDue, type Cadence } from '../../db/series';
import { useUi } from '../../store/ui';
import { useTopBar } from '../shell/TopBar';
import { Button } from '../common/Button';
import { SeriesCard } from './SeriesCard';
import { track } from '../../lib/gtag';
import './series.css';

const to = (p: string) => p as LinkProps['to'];

export function Series(): React.JSX.Element {
  const navigate = useNavigate();
  const storage = useUi((s) => s.storage);
  const toast = useUi((s) => s.toast);
  const [list, setList] = useState<SeriesDoc[]>([]);
  const [charts, setCharts] = useState<Map<string, ChartDoc>>(new Map());
  const [dialog, setDialog] = useState(false);
  const [pickChart, setPickChart] = useState('');
  const [cadence, setCadence] = useState<Cadence>('monthly');

  const reload = useCallback(async () => {
    if (storage !== 'ok') return;
    const [s, c] = await Promise.all([listSeries(), db.charts.toArray()]);
    setList(s);
    setCharts(new Map(c.map((d) => [d.id, d])));
  }, [storage]);

  useEffect(() => { void reload(); void notifyDue(); }, [reload]);

  useEffect(() => {
    useTopBar.getState().set({ crumb: 'Series', actions: <Button variant="primary" icon={<Plus size={14} />} onClick={() => setDialog(true)} aria-label="New series">New series</Button> });
    return () => useTopBar.getState().set({ crumb: undefined, actions: undefined });
  }, []);

  const create = async () => {
    if (!pickChart) return;
    await createSeries(pickChart, cadence);
    setDialog(false);
    await reload();
  };

  const update = async (s: SeriesDoc, rows: Parameters<typeof applyUpdate>[1]) => {
    try {
      const r = await applyUpdate(s.id, rows);
      track('series_update', { cadence: s.cadence });
      if (r.unmatched.length) toast(`Not matched: ${r.unmatched.join(', ')}`);
      void navigate({ to: to('/edit/$id'), params: { id: r.chartId }, search: { export: 'set' } } as never);
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not update.'); }
  };

  const savedCharts = [...charts.values()].sort((a, b) => b.updatedAt - a.updatedAt);

  if (storage !== 'ok') {
    return <section className="cg-page"><h1 className="cg-h1" style={{ fontSize: 40 }}>Series</h1><p className="cg-hint" style={{ fontSize: 14 }}>This browser is not letting ChartGenie save, so recurring charts cannot be kept here.</p></section>;
  }

  return (
    <div className="cg-page cg-series">
      <h1 className="cg-h1" style={{ fontSize: 30 }}>Recurring charts</h1>
      {list.length === 0 ? (
        <section className="cg-card cg-mycharts-empty">
          <span className="cg-lbl">Monthly habit</span>
          <span className="cg-lookcard-blank-title">No recurring charts yet</span>
          <span className="cg-hint">Mark a saved chart as recurring. Each period it asks for the new numbers and keeps the look, the size and your handle.</span>
          <Button variant="primary" onClick={() => setDialog(true)} disabled={savedCharts.length === 0}>{savedCharts.length ? 'New series' : 'Save a chart first'}</Button>
        </section>
      ) : (
        <div className="cg-series-list">
          {list.map((s) => (
            <SeriesCard key={s.id} series={s} chart={charts.get(s.chartId)} onUpdate={(rows) => update(s, rows)} onSkip={async () => { await skip(s.id); await reload(); }} onDelete={async () => { await deleteSeries(s.id); await reload(); toast('Series removed. The chart itself is still in My charts.'); }} />
          ))}
        </div>
      )}
      <p className="cg-hint">Due dates show in the app. Nothing is sent anywhere; open ChartGenie and the next one is waiting.</p>
      {dialog && (
        <div className="cg-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(false); }}>
          <div className="cg-dialog" role="dialog" aria-modal="true" aria-labelledby="cg-series-title">
            <h2 id="cg-series-title" className="cg-dialog-title">New series</h2>
            <label className="cg-field">
              <span className="cg-lbl">Chart</span>
              <select className="cg-input" aria-label="Chart" value={pickChart} onChange={(e) => setPickChart(e.target.value)}>
                <option value="">Pick a saved chart…</option>
                {savedCharts.map((c) => <option key={c.id} value={c.id}>{c.spec.text.title || 'Untitled'}</option>)}
              </select>
            </label>
            <div className="cg-field">
              <span className="cg-lbl">Cadence</span>
              <div className="cg-seg" role="radiogroup" aria-label="Cadence">
                {(['weekly', 'monthly', 'quarterly'] as Cadence[]).map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={cadence === c} className="cg-seg-opt" data-on={cadence === c ? 'true' : undefined} onClick={() => setCadence(c)}>{c[0].toUpperCase() + c.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="cg-dialog-actions">
              <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
              <Button variant="primary" disabled={!pickChart} onClick={create} aria-label="Create series">Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
