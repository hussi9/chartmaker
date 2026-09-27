// Export set: choose sizes, get one zip with PNG + SVG each, caption and alt text.
import { useEffect, useRef, useState } from 'react';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { POST_SIZES, POST_SIZE_IDS, type PostSizeId } from '../../chart/types';
import { Toggle } from '../common/Toggle';
import { Button } from '../common/Button';
import { buildExportSet, exportFileStem } from '../../export/exportSet';
import { downloadBlob } from '../../export/png';
import { altText } from '../../chart/alt';
import { insights } from '../../insights';
import { captionFrom } from '../../caption/templates';
import { track } from '../../lib/gtag';

export function captionText(spec: ReturnType<typeof useDoc.getState>['spec']): string {
  return spec.caption?.text ?? captionFrom(spec, insights(spec.data), spec.caption?.tone ?? 'punchy');
}

export interface ExportSetPanelProps { /** Run the export once on mount (Series → "Update & export set"). */ autoRun?: boolean; onAutoRun?: () => void }

export function ExportSetPanel({ autoRun, onAutoRun }: ExportSetPanelProps = {}): React.JSX.Element {
  const spec = useDoc((s) => s.spec);
  const sizes = useUi((s) => s.exportSizes);
  const setSizes = useUi((s) => s.setExportSizes);
  const toast = useUi((s) => s.toast);
  const [progress, setProgress] = useState<[number, number] | null>(null);

  const toggle = (id: PostSizeId, on: boolean) => setSizes(on ? [...POST_SIZE_IDS.filter((s) => s === id || sizes.includes(s))] : sizes.filter((s) => s !== id));

  const ran = useRef(false);
  useEffect(() => {
    if (!autoRun || ran.current) return;
    ran.current = true;
    onAutoRun?.();
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const run = async () => {
    if (sizes.length === 0) { toast('Pick at least one size.'); return; }
    setProgress([0, sizes.length * 2]);
    try {
      const zip = await buildExportSet(spec, sizes, captionText(spec), altText(spec, insights(spec.data)), (d, t) => setProgress([d, t]));
      downloadBlob(zip, `${exportFileStem(spec.text.title)}-export-set.zip`);
      track('export_set', { sizes: sizes.length, formats: 'png+svg' });
      toast(`Export set ready: ${sizes.length} size${sizes.length === 1 ? '' : 's'}, PNG + SVG, caption and alt text.`);
    } catch (e) {
      toast(`Export failed: ${e instanceof Error ? e.message : 'unknown error'}. Try again.`, { label: 'Retry', run: () => void run() });
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="cg-cell cg-exportset">
      <span className="cg-lbl">Export set</span>
      <div className="cg-exportset-sizes">
        {POST_SIZE_IDS.map((id) => (
          <Toggle key={id} id={`export-${id}`} label={`${id} · ${POST_SIZES[id].label} · ${POST_SIZES[id].w}×${POST_SIZES[id].h}`} checked={sizes.includes(id)} onChange={(on) => toggle(id, on)} />
        ))}
      </div>
      <span className="cg-hint">PNG + SVG each, plus caption.txt and alt-text.txt. Zipped.</span>
      <Button variant="primary" onClick={run} disabled={progress !== null} aria-label="Download export set">
        {progress ? `Rendering ${progress[0]} / ${progress[1]}…` : 'Export set'}
      </Button>
    </div>
  );
}
