// Facts computed from the rows. Tap one to pin it on the chart as a callout.
import { useMemo } from 'react';
import { useDoc, newId } from '../../store/document';
import { insights } from '../../insights';
import type { Insight } from '../../insights/types';

export function InsightsPanel(): React.JSX.Element {
  const rows = useDoc((s) => s.spec.data);
  const callouts = useDoc((s) => s.spec.callouts);
  const setSpec = useDoc((s) => s.setSpec);
  const list = useMemo(() => insights(rows), [rows]);
  const largest = useMemo(() => [...rows].sort((a, b) => b.value - a.value)[0], [rows]);

  const toggle = (ins: Insight) => {
    const existing = callouts.find((c) => c.insightId === ins.id);
    if (existing) {
      setSpec((d) => { d.callouts = d.callouts.filter((c) => c.id !== existing.id); });
      return;
    }
    const rowId = ins.rowId ?? largest?.id;
    if (!rowId) return;
    setSpec((d) => { d.callouts.push({ id: newId(), insightId: ins.id, text: ins.text, anchor: { rowId } }); });
  };

  if (rows.length === 0) {
    return <div className="cg-cell cg-hint">Add some rows and the facts inside them appear here.</div>;
  }

  return (
    <div className="cg-cell">
      <span className="cg-lbl">Tap to add as a callout</span>
      <ul className="cg-insights" aria-label="Insights">
        {list.map((ins) => {
          const on = callouts.some((c) => c.insightId === ins.id);
          return (
            <li key={ins.id}>
              <button type="button" className="cg-insight" data-on={on ? 'true' : undefined} aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${ins.text}`} onClick={() => toggle(ins)}>
                <span>{ins.text}</span>
                <span className="cg-mono cg-insight-state">{on ? 'on chart' : '+ add'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
