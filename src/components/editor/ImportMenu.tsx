// Import ▾: Paste text (dialog), CSV file, Sample data.
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDoc, newId } from '../../store/document';
import { useUi } from '../../store/ui';
import { detect, detectCsvFile } from '../../insights/intake';
import { SAMPLE_ROWS } from '../../chart/types';
import { Button } from '../common/Button';

export function ImportMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [text, setText] = useState('');
  const setRows = useDoc((s) => s.setRows);
  const setSpec = useDoc((s) => s.setSpec);
  const toast = useUi((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const applyDetection = (d: ReturnType<typeof detect>) => {
    if (d.rows.length === 0) { toast('No rows were found in that text.'); return; }
    setSpec((s) => {
      s.data = d.rows.map((r) => ({ ...r, id: newId() }));
      if (d.title && !s.text.title) s.text.title = d.title;
    });
    if (d.warnings.length) toast(d.warnings[0]);
  };

  const detected = detect(text);

  return (
    <div ref={wrap} className="cg-import">
      <Button size="sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} icon={<ChevronDown size={14} />}>Import</Button>
      {open && (
        <div role="menu" className="cg-menu" aria-label="Import">
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => { setOpen(false); setPasteOpen(true); }}>Paste text</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => { setOpen(false); fileRef.current?.click(); }}>CSV file</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => { setOpen(false); setRows(SAMPLE_ROWS.map((r) => ({ ...r, id: newId() }))); }}>Sample data</button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        aria-label="CSV file"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          applyDetection(await detectCsvFile(f));
          e.target.value = '';
        }}
      />
      {pasteOpen && (
        <div className="cg-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPasteOpen(false); }}>
          <div className="cg-dialog" role="dialog" aria-modal="true" aria-labelledby="cg-paste-title">
            <h2 id="cg-paste-title" className="cg-dialog-title">Paste text</h2>
            <p className="cg-dialog-body">Cells from a spreadsheet, a CSV, or a sentence like “Revenue grew from 12k in Jan to 34k in Jun”.</p>
            <textarea className="cg-textarea" aria-label="Text to parse" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'USA        87\nItaly      20'} autoFocus />
            <div className="cg-dialog-status cg-mono" aria-live="polite">
              {detected.rows.length ? `Detected: ${detected.rows.length} rows · ${detected.kind}${detected.unit ? ` · ${detected.unit}` : ''}` : 'Paste rows to see what is detected'}
            </div>
            <div className="cg-dialog-actions">
              <Button variant="ghost" onClick={() => setPasteOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={detected.rows.length === 0} onClick={() => { applyDetection(detected); setPasteOpen(false); setText(''); }}>Use {detected.rows.length ? `${detected.rows.length} rows` : 'rows'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
