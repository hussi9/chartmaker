// The data grid: label · value · unit per row, keyboard-first, undoable.
// Tab moves, Enter adds a row, Backspace on an empty row removes it,
// ⌘↑/⌘↓ reorder, ⌘D duplicates, a multi-line paste fills rows.
import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useDoc, newId } from '../../store/document';
import { useUi } from '../../store/ui';
import { formatNumber } from '../../chart/format';
import { detect, parseValue } from '../../insights/intake';
import { PALETTES, type Row, type Unit } from '../../chart/types';
import { Seg } from '../common/Seg';
import { Chip } from '../common/Chip';
import { ImportMenu } from './ImportMenu';
import './editor.css';

const ROW_H = 40;
const WINDOW = 100; // rows above this count are windowed
const OVERSCAN = 10;

const UNIT_OPTIONS: { value: Unit | 'number'; label: string; title: string }[] = [
  { value: 'number', label: '123', title: 'Plain numbers' },
  { value: 'percent', label: '%', title: 'Percent' },
  { value: 'currency', label: '$', title: 'Currency' },
  { value: 'compact', label: 'k / M', title: 'Thousands and millions' },
];

function displayValue(r: Row): string {
  return Number.isFinite(r.value) ? String(r.value) : '';
}

export function DataGrid(): React.JSX.Element {
  const rows = useDoc((s) => s.spec.data);
  const palette = useDoc((s) => s.spec.palette);
  const setSpec = useDoc((s) => s.setSpec);
  const setRows = useDoc((s) => s.setRows);
  const toast = useUi((s) => s.toast);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [focusRow, setFocusRow] = useState<{ index: number; col: 'label' | 'value' } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const total = useMemo(() => rows.reduce((a, r) => a + (Number.isFinite(r.value) ? r.value : 0), 0), [rows]);
  const avg = rows.length ? total / rows.length : 0;
  const unit = useMemo<Unit | 'number'>(() => {
    const counts = new Map<Unit, number>();
    for (const r of rows) if (r.unit) counts.set(r.unit, (counts.get(r.unit) ?? 0) + 1);
    let best: Unit | undefined; let n = 0;
    for (const [u, c] of counts) if (c > n) { n = c; best = u; }
    return best ?? 'number';
  }, [rows]);

  useEffect(() => {
    if (!focusRow) return;
    const key = `${focusRow.col}-${focusRow.index}`;
    const el = inputs.current.get(key);
    if (el) { el.focus(); setFocusRow(null); }
  }, [focusRow, rows]);

  const register = useCallback((key: string) => (el: HTMLInputElement | null) => { if (el) inputs.current.set(key, el); else inputs.current.delete(key); }, []);

  const update = (i: number, patch: Partial<Row>) => setSpec((d) => { Object.assign(d.data[i], patch); });
  const insertAfter = (i: number) => {
    setSpec((d) => { d.data.splice(i + 1, 0, { id: newId(), label: '', value: 0 }); });
    setFocusRow({ index: i + 1, col: 'label' });
  };
  const remove = (i: number) => {
    setSpec((d) => { d.data.splice(i, 1); });
    setFocusRow({ index: Math.max(0, i - 1), col: 'label' });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    setSpec((d) => { const [r] = d.data.splice(i, 1); d.data.splice(j, 0, r); });
    setFocusRow({ index: j, col: 'label' });
  };
  const duplicate = (i: number) => {
    setSpec((d) => { d.data.splice(i + 1, 0, { ...d.data[i], id: newId() }); });
    setFocusRow({ index: i + 1, col: 'label' });
  };
  const appendFromTrailing = (col: 'label' | 'value', text: string) => {
    const parsed = col === 'value' ? parseValue(text) : null;
    setSpec((d) => { d.data.push({ id: newId(), label: col === 'label' ? text : '', value: parsed?.value ?? 0, ...(parsed?.unit ? { unit: parsed.unit } : {}) }); });
    setFocusRow({ index: rows.length, col });
  };

  const commitValue = (i: number, raw: string) => {
    const key = `value-${rows[i].id}`;
    setDrafts((d) => { const { [key]: _drop, ...rest } = d; void _drop; return rest; });
    const parsed = parseValue(raw);
    if (!parsed) { if (raw.trim() === '') update(i, { value: 0 }); return; }
    update(i, { value: parsed.value, ...(parsed.unit ? { unit: parsed.unit } : {}) });
  };

  const onKey = (i: number, col: 'label' | 'value') => (e: KeyboardEvent<HTMLInputElement>) => {
    const meta = e.metaKey || e.ctrlKey;
    if (e.key === 'Enter') { e.preventDefault(); if (col === 'value') commitValue(i, e.currentTarget.value); insertAfter(i); return; }
    if (e.key === 'Backspace' && col === 'label' && e.currentTarget.value === '' && rows.length > 1) { e.preventDefault(); remove(i); return; }
    if (meta && e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); return; }
    if (meta && e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); return; }
    if (meta && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); duplicate(i); return; }
  };

  const onPaste = (i: number | null, col: 'label' | 'value') => (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text.includes('\n') && !text.includes('\t')) return;
    const det = detect(text);
    if (det.rows.length === 0) return;
    e.preventDefault();
    setSpec((d) => {
      const at = i == null ? d.data.length : i;
      const fresh = det.rows.map((r) => ({ ...r, id: newId() }));
      if (i != null && d.data[i] && d.data[i].label === '' ) d.data.splice(i, 1, ...fresh);
      else d.data.splice(at + (i == null ? 0 : 1), 0, ...fresh);
    });
    if (det.warnings.length) toast(det.warnings[0]);
    void col;
  };

  const sort = () => {
    const dir = sortDir;
    setRows([...rows].sort((a, b) => (dir === 'desc' ? b.value - a.value : a.value - b.value)));
    setSortDir(dir === 'desc' ? 'asc' : 'desc');
  };
  const percentOfTotal = () => {
    if (total <= 0) { toast('Values need a positive total to become shares.'); return; }
    setRows(rows.map((r) => ({ ...r, value: Math.round((r.value / total) * 1000) / 10, unit: 'percent' })));
  };
  const setUnit = (u: Unit | 'number') => setRows(rows.map((r) => (u === 'number' ? { ...r, unit: undefined } : { ...r, unit: u })));
  const cycleColour = (i: number) => {
    const list = palette.length ? palette : PALETTES[0].colors;
    const cur = rows[i].color ?? list[i % list.length];
    const idx = list.indexOf(cur);
    update(i, { color: list[(idx + 1) % list.length] });
  };

  // Windowing for long lists.
  const windowed = rows.length > WINDOW;
  const viewportH = 400;
  const start = windowed ? Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN) : 0;
  const end = windowed ? Math.min(rows.length, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN) : rows.length;
  const visible = rows.slice(start, end);

  return (
    <section className="cg-grid" aria-label="Data">
      <div className="cg-grid-head">
        <span className="cg-grid-title">Data</span>
        <div className="cg-grid-head-actions">
          <Chip onClick={percentOfTotal} title="Convert every value to its share of the total">% of total</Chip>
          <ImportMenu />
        </div>
      </div>
      <div className="cg-grid-cols cg-lbl" aria-hidden="true"><span /><span>Label</span><span className="cg-grid-col-value">Value</span></div>
      <div ref={listRef} className={`cg-grid-list ${windowed ? 'cg-grid-windowed' : ''}`} onScroll={windowed ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined} style={windowed ? { maxHeight: viewportH, overflowY: 'auto' } : undefined}>
        {windowed && <div style={{ height: start * ROW_H }} aria-hidden="true" />}
        {visible.map((r, vi) => {
          const i = start + vi;
          const color = r.color ?? (palette[i % Math.max(1, palette.length)] ?? '#1e293b');
          const draftKey = `value-${r.id}`;
          return (
            <div key={r.id} className="cg-row" style={{ height: ROW_H }}>
              <button type="button" className="cg-dot" style={{ background: color }} aria-label={`Colour for ${r.label || 'row'}`} title="Click to cycle the palette" onClick={() => cycleColour(i)} />
              <input
                ref={register(`label-${i}`)}
                className="cg-cell-input"
                aria-label={`Label ${i + 1}`}
                value={r.label}
                onChange={(e) => update(i, { label: e.target.value })}
                onKeyDown={onKey(i, 'label')}
                onPaste={onPaste(i, 'label')}
              />
              <input
                ref={register(`value-${i}`)}
                className="cg-cell-input cg-cell-value"
                aria-label={`Value ${i + 1}`}
                inputMode="decimal"
                value={drafts[draftKey] ?? displayValue(r)}
                onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                onBlur={(e) => commitValue(i, e.target.value)}
                onKeyDown={onKey(i, 'value')}
                onPaste={onPaste(i, 'value')}
              />
            </div>
          );
        })}
        {windowed && <div style={{ height: (rows.length - end) * ROW_H }} aria-hidden="true" />}
        {!windowed && (
          <div className="cg-row cg-row-trailing" style={{ height: ROW_H }}>
            <span className="cg-dot cg-dot-empty" aria-hidden="true" />
            <input ref={register(`label-${rows.length}`)} className="cg-cell-input" aria-label={`Label ${rows.length + 1}`} placeholder="Type a label…" value="" onChange={(e) => appendFromTrailing('label', e.target.value)} onPaste={onPaste(null, 'label')} />
            <input ref={register(`value-${rows.length}`)} className="cg-cell-input cg-cell-value" aria-label={`Value ${rows.length + 1}`} inputMode="decimal" value="" onChange={(e) => appendFromTrailing('value', e.target.value)} onPaste={onPaste(null, 'value')} />
          </div>
        )}
      </div>
      <div className="cg-grid-foot cg-mono">
        <span>{windowed ? `${rows.length} rows · ` : ''}Total {formatNumber(total, unit === 'number' ? undefined : unit)} · avg {formatNumber(avg, unit === 'number' ? undefined : unit)}</span>
        <span aria-hidden="true">⇥ ⏎ ⌘↑↓ ⌘D</span>
      </div>
      <div className="cg-grid-tools">
        <Chip onClick={sort} aria-label={`Sort ${sortDir === 'desc' ? 'descending' : 'ascending'}`}>Sort {sortDir === 'desc' ? '↓' : '↑'}</Chip>
        <Seg label="Units" size="sm" value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
      </div>
    </section>
  );
}
