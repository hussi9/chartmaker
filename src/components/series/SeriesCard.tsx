import { useMemo, useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ChartDoc, SeriesDoc } from '../../db';
import { Chart } from '../../chart/render/Chart';
import { detect } from '../../insights/intake';
import { relativeTime } from '../../lib/time';
import { Button } from '../common/Button';
import type { Row } from '../../chart/types';

const to = (p: string) => p as LinkProps['to'];

export interface SeriesCardProps { series: SeriesDoc; chart?: ChartDoc; onUpdate: (rows: Row[]) => void; onSkip: () => void; onDelete: () => void }

function dueLabel(nextDue: number): { due: boolean; text: string } {
  const due = nextDue <= Date.now();
  if (due) return { due, text: 'Due' };
  return { due, text: `next ${new Date(nextDue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` };
}

export function SeriesCard({ series, chart, onUpdate, onSkip, onDelete }: SeriesCardProps): React.JSX.Element {
  const [text, setText] = useState('');
  const det = useMemo(() => detect(text), [text]);
  const labels = chart?.spec.data.map((r) => r.label) ?? [];
  const unmatched = det.rows.filter((r) => !labels.some((l) => l.trim().toLowerCase() === r.label.trim().toLowerCase())).map((r) => r.label);
  const { due, text: dueText } = dueLabel(series.nextDue);
  const title = chart?.spec.text.title || 'Untitled';

  if (!chart) {
    return (
      <article className="cg-card cg-seriescard cg-seriescard-row" aria-label="Missing chart">
        <div className="cg-seriescard-body"><div className="cg-seriescard-name">This series points at a chart that was deleted.</div></div>
        <Button variant="ghost" onClick={onDelete}>Remove</Button>
      </article>
    );
  }

  return (
    <article className={`cg-card cg-seriescard ${due ? 'cg-seriescard-due' : ''}`} aria-label={title}>
      <div className="cg-seriescard-thumb">
        <Chart spec={chart.spec} static />
        {chart.spec.options.ghost && <span className="cg-mono cg-seriescard-ghost">grey = last time</span>}
      </div>
      <div className="cg-seriescard-body">
        <div className="cg-seriescard-head">
          <span className="cg-seriescard-name">{title} · {series.cadence}</span>
          <span className={`cg-chip ${due ? 'cg-chip-tint' : ''}`} style={{ height: 24, fontSize: 11 }}>{dueText}</span>
        </div>
        <span className="cg-hint">
          {due ? `Paste this period’s ${labels.length} numbers by label. The look, size, handle and caption tone are kept; last time sits faded behind for comparison.` : `${series.snapshots.length} update${series.snapshots.length === 1 ? '' : 's'} so far${series.snapshots.length ? ` · last ${relativeTime(series.snapshots.at(-1)!.at)}` : ''}.`}
        </span>
        <textarea className="cg-textarea cg-seriescard-paste" aria-label="New values" rows={3} placeholder={`${labels.slice(0, 3).join(', ')}${labels.length > 3 ? ', …' : ''} → paste here`} value={text} onChange={(e) => setText(e.target.value)} />
        {unmatched.length > 0 && <span className="cg-hint cg-warn">Not in this chart: {unmatched.join(', ')}</span>}
        <div className="cg-seriescard-actions">
          <Button variant="primary" disabled={det.rows.length === 0} onClick={() => onUpdate(det.rows)} aria-label="Update & export set">Update &amp; export set</Button>
          {due && <Button variant="ghost" onClick={onSkip} aria-label="Skip this period">Skip this period</Button>}
          <Link to={to('/edit/$id')} params={{ id: chart.id } as never} className="cg-btn cg-btn-ghost">Open</Link>
          <Button variant="ghost" onClick={onDelete} aria-label={`Remove series ${title}`}>Remove</Button>
        </div>
      </div>
    </article>
  );
}
