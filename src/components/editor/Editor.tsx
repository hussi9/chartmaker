// The editor: data left, the post in the middle at true size, style right.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearch, type LinkProps } from '@tanstack/react-router';
import { Link2 } from 'lucide-react';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { useTopBar } from '../shell/TopBar';
import { DataGrid } from './DataGrid';
import { TextOnChart } from './TextOnChart';
import { Artboard } from './Artboard';
import { SizeBar } from './SizeBar';
import { LookStrip } from './LookStrip';
import { StylePanel } from './StylePanel';
import { InsightsPanel } from './InsightsPanel';
import { CaptionPanel } from './CaptionPanel';
import { ExportSetPanel } from './ExportSetPanel';
import { ChecksList } from './ChecksList';
import { ExportMenu } from './ExportMenu';
import { Button } from '../common/Button';
import { checks } from '../../chart/checks';
import { insights } from '../../insights';
import { canvasMeasurer } from '../../chart/measure';
import { shareUrls } from '../../codec/state';
import { track } from '../../lib/gtag';
import { db, type BrandDoc } from '../../db';
import { applyBrand, blobToDataUrl, safePalette } from '../../chart/cvd';
import './editor.css';

const homeTo = '/' as LinkProps['to'];

function saveLabel(state: string): string {
  return state === 'saved' ? 'Autosaved' : state === 'saving' ? 'Saving' : state === 'unavailable' ? 'Not saved in this browser' : state === 'error' ? 'Save failed' : '';
}

export function Editor(): React.JSX.Element {
  const params = useParams({ strict: false }) as { id?: string };
  const search = useSearch({ strict: false }) as { export?: string };
  const navigate = useNavigate();
  const doc = useDoc();
  const ui = useUi();
  const [scale, setScale] = useState(0.5);
  const [brand, setBrand] = useState<BrandDoc | null>(null);
  useEffect(() => { if (ui.storage === 'ok') void db.brand.get('brand').then((b) => setBrand(b ?? null)); }, [ui.storage]);
  const measure = useMemo(() => canvasMeasurer(), []);

  // Route id → store. A freshly created doc is already in the store; otherwise load it.
  useEffect(() => {
    const id = params.id;
    if (!id || doc.id === id) return;
    void doc.load(id).then((ok) => { if (!ok) void navigate({ to: homeTo }); });
  }, [params.id, doc.id, doc.load, navigate]);

  const ins = useMemo(() => insights(doc.spec.data), [doc.spec.data]);
  const results = useMemo(() => checks(doc.spec, ui.exportSizes, ui.safeZones, measure, ins), [doc.spec, ui.exportSizes, ui.safeZones, measure, ins]);
  const ready = results.every((c) => c.pass);

  const share = useCallback(async () => {
    const urls = shareUrls(doc.spec, window.location.origin);
    if (urls.error) { ui.toast(urls.error); return; }
    const url = urls.path ?? urls.hash;
    const mode = urls.path ? 'path' : 'hash';
    try {
      await navigator.clipboard.writeText(url);
      ui.toast(mode === 'path' ? 'Link copied. It unfurls with a preview card.' : 'Link copied (long chart: no preview card).');
      track('share_copy', { mode });
      if (doc.id && ui.storage === 'ok') {
        const existing = await db.charts.get(doc.id);
        if (existing) await db.charts.put({ ...existing, sharedAt: Date.now(), sharedUrl: url });
      }
    } catch {
      ui.toast('Could not copy. The link is in the address bar.');
      window.history.replaceState(null, '', url);
    }
  }, [doc.spec, doc.id, ui]);

  useEffect(() => {
    useTopBar.getState().set({
      crumb: doc.spec.text.title || 'Untitled',
      status: (
        <>
          <span className={`cg-chip cg-chip-status ${ready ? 'cg-chip-tint' : ''}`} title={results.map((c) => `${c.pass ? '✓' : '✗'} ${c.detail}`).join('\n')}>{ready ? 'Post-ready ✓' : `Checks: ${results.filter((c) => !c.pass).length} to fix`}</span>
          <span className="cg-mono cg-autosave" data-state={doc.saveState} role="status" aria-label={saveLabel(doc.saveState)} title={saveLabel(doc.saveState)}>
            <span aria-hidden="true">{doc.saveState === 'saved' ? '●' : '○'}</span>
            <span className="cg-autosave-text"> {saveLabel(doc.saveState)}</span>
          </span>
        </>
      ),
      actions: (
        <>
          <Button onClick={share} icon={<Link2 size={14} />} aria-label="Share link"><span className="cg-btn-text">Share link</span></Button>
          <ExportMenu />
        </>
      ),
    });
    return () => useTopBar.getState().set({ crumb: undefined, status: undefined, actions: undefined });
  }, [doc.spec.text.title, doc.saveState, ready, results, share]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) useDoc.temporal.getState().redo(); else useDoc.temporal.getState().undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onScale = useCallback((s: number) => setScale(s), []);

  return (
    <div className={`cg-editor ${ui.narrow ? 'cg-editor-narrow' : ''}`}>
      <aside className="cg-editor-left" aria-label="Data and text">
        <DataGrid />
        <TextOnChart />
      </aside>
      <section className="cg-editor-centre">
        <SizeBar size={doc.spec.size} onSize={(s) => { doc.setSpec((d) => { d.size = s; }); track('size_change', { size: s }); }} safeZones={ui.safeZones} onSafeZones={ui.setSafeZones} scale={scale} />
        <Artboard spec={doc.spec} safeZones={ui.safeZones} onScale={onScale} fitHeight={!ui.narrow} />
        <LookStrip
          type={doc.spec.type}
          rows={doc.spec.data}
          look={doc.spec.look}
          onType={(t) => doc.setSpec((d) => { d.type = t; })}
          onLook={(l) => { doc.setSpec((d) => { d.look = l; }); track('look_change', { look: l }); }}
          hasBrand={brand !== null}
          onApplyBrand={async () => {
            if (!brand) return;
            const logo = brand.logo ? await blobToDataUrl(brand.logo).catch(() => undefined) : undefined;
            const next = applyBrand(doc.spec, brand, logo);
            doc.setSpec((d) => { d.palette = next.palette; d.data = next.data; d.options = next.options; });
            track('brand_apply', {});
          }}
        />
      </section>
      <aside className="cg-editor-right" role="region" aria-label="Style">
        <div className="cg-tabs" role="tablist" aria-label="Panels">
          {(['insights', 'caption', 'style'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={ui.rightTab === t} className="cg-tab-btn" data-on={ui.rightTab === t ? 'true' : undefined} onClick={() => ui.setRightTab(t)}>
              {t === 'insights' ? 'Insights' : t === 'caption' ? 'Caption' : 'Style'}
            </button>
          ))}
        </div>
        {ui.rightTab === 'insights' && <InsightsPanel />}
        {ui.rightTab === 'caption' && <CaptionPanel />}
        {ui.rightTab === 'style' && <StylePanel brandPalette={brand ? { id: 'brand', name: 'My brand', colors: brand.safe ? safePalette(brand.palette) : brand.palette } : undefined} />}
        <div className="cg-editor-right-foot">
          <ExportSetPanel autoRun={search.export === 'set'} onAutoRun={() => void navigate({ to: '/edit/$id' as never, params: { id: params.id } as never, search: {} as never, replace: true })} />
          <ChecksList results={results} />
        </div>
      </aside>
    </div>
  );
}
