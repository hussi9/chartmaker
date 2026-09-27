// Export ▾ in the top bar: export set, PNG at the current size, SVG, CSV, copy data.
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { Button } from '../common/Button';
import { buildExportSet, exportFileStem } from '../../export/exportSet';
import { downloadBlob, pngBlob } from '../../export/png';
import { svgBlob } from '../../export/svg';
import { csvString } from '../../export/csv';
import { altText } from '../../chart/alt';
import { insights } from '../../insights';
import { captionText } from './ExportSetPanel';
import { track } from '../../lib/gtag';

export function ExportMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const toast = useUi((s) => s.toast);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const guard = async (label: string, fn: () => Promise<void>) => {
    setOpen(false);
    setBusy(label);
    try { await fn(); } catch (e) { toast(`${label} failed: ${e instanceof Error ? e.message : 'unknown error'}.`); } finally { setBusy(null); }
  };

  const spec = () => useDoc.getState().spec;
  const stem = () => exportFileStem(spec().text.title);

  return (
    <div ref={wrap} className="cg-import">
      <Button variant="primary" aria-haspopup="menu" aria-expanded={open} aria-label="Export" disabled={busy !== null} onClick={() => setOpen((o) => !o)} icon={<Download size={14} />}>
        <span className="cg-btn-text">{busy ? `${busy}…` : 'Export set'}</span><ChevronDown size={14} aria-hidden="true" />
      </Button>
      {open && (
        <div role="menu" className="cg-menu" aria-label="Export">
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => guard('Export set', async () => {
            const s = spec(); const sizes = useUi.getState().exportSizes;
            const zip = await buildExportSet(s, sizes, captionText(s), altText(s, insights(s.data)));
            downloadBlob(zip, `${stem()}-export-set.zip`);
            track('export_set', { sizes: sizes.length, formats: 'png+svg' });
          })}>Export set (zip)</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => guard('PNG', async () => {
            const s = spec(); downloadBlob(await pngBlob(s, s.size), `${stem()}-${s.size.replace(':', 'x')}.png`); track('export_one', { format: 'png' });
          })}>PNG · current size</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => guard('SVG', async () => {
            const s = spec(); downloadBlob(svgBlob(s, s.size), `${stem()}-${s.size.replace(':', 'x')}.svg`); track('export_one', { format: 'svg' });
          })}>SVG</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => guard('CSV', async () => {
            downloadBlob(new Blob([csvString(spec().data)], { type: 'text/csv' }), `${stem()}.csv`); track('export_one', { format: 'csv' });
          })}>CSV</button>
          <button type="button" role="menuitem" className="cg-menu-item" onClick={() => guard('Copy data', async () => {
            await navigator.clipboard.writeText(csvString(spec().data)); toast('Data copied as CSV'); track('export_one', { format: 'copy' });
          })}>Copy data</button>
        </div>
      )}
    </div>
  );
}
