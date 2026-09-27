// What a viewer sees when they follow a link: the chart, the caption, the data,
// and a door back in. The link is the chart; nothing is fetched or stored.
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, type LinkProps } from '@tanstack/react-router';
import { Chart } from '../../chart/render/Chart';
import { decodeLegacyHash, decodeState } from '../../codec/state';
import { formatValue } from '../../chart/format';
import { useDoc, newId } from '../../store/document';
import { useUi } from '../../store/ui';
import { useTopBar } from '../shell/TopBar';
import { Button } from '../common/Button';
import { pngBlob, downloadBlob } from '../../export/png';
import { exportFileStem } from '../../export/exportSet';
import { csvString } from '../../export/csv';
import { captionFrom } from '../../caption/templates';
import { insights } from '../../insights';
import { track } from '../../lib/gtag';
import type { ChartSpec } from '../../chart/types';
import './share.css';

const to = (p: string) => p as LinkProps['to'];

function readState(pathState: string | undefined): ChartSpec | null {
  if (pathState) return decodeState(pathState);
  const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  if (!hash) return null;
  return decodeState(hash) ?? decodeLegacyHash(hash);
}

export function SharePage(): React.JSX.Element {
  const params = useParams({ strict: false }) as { state?: string };
  const navigate = useNavigate();
  const narrow = useUi((s) => s.narrow);
  const toast = useUi((s) => s.toast);
  const spec = useMemo(() => readState(params.state), [params.state]);

  useEffect(() => {
    useTopBar.getState().set({ crumb: spec ? spec.text.title || 'Shared chart' : 'Shared chart' });
    return () => useTopBar.getState().set({ crumb: undefined });
  }, [spec]);

  if (!spec) {
    return (
      <section className="cg-page">
        <span className="cg-lbl">Shared chart</span>
        <h1 className="cg-h1" style={{ fontSize: 32 }}>This link doesn’t contain a chart.</h1>
        <p className="cg-hint" style={{ fontSize: 14 }}>Share links carry the whole chart inside the address. This one is incomplete or was typed by hand.</p>
        <div><Link to={to('/')} className="cg-btn cg-btn-primary">Make one</Link></div>
      </section>
    );
  }

  const total = spec.data.reduce((a, r) => a + r.value, 0);
  const caption = spec.caption?.text ?? captionFrom(spec, insights(spec.data), spec.caption?.tone ?? 'punchy');
  const handle = spec.options.showHandle && spec.options.handle ? spec.options.handle : undefined;

  const remix = () => {
    const id = useDoc.getState().openSpec({
      ...spec,
      data: spec.data.map((r) => ({ ...r, value: 0 })),
      callouts: [],
      caption: undefined,
      options: { ...spec.options, handle: undefined, showHandle: false, remixedFrom: handle ?? spec.options.remixedFrom },
    }, newId());
    track('remix_open', {});
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };

  const download = async () => {
    try { downloadBlob(await pngBlob(spec, spec.size), `${exportFileStem(spec.text.title)}-${spec.size.replace(':', 'x')}.png`); }
    catch (e) { toast(`Download failed: ${e instanceof Error ? e.message : 'unknown error'}.`); }
  };

  const copyData = async () => {
    try { await navigator.clipboard.writeText(csvString(spec.data)); toast('Data copied as CSV'); } catch { toast('Could not copy.'); }
  };

  return (
    <div className={`cg-share ${narrow ? 'cg-share-narrow' : ''}`}>
      <div className="cg-share-stage">
        <div className="cg-share-card" style={{ boxShadow: 'var(--shadow-artboard)' }}>
          <Chart spec={spec} static />
        </div>
      </div>
      <aside className="cg-share-side">
        {handle && (
          <div className="cg-share-author">
            <span className="cg-rail-avatar" aria-hidden="true">{handle.charAt(0).toUpperCase()}</span>
            <div><div className="cg-share-handle">@{handle}</div><div className="cg-mono cg-hint">shared as a link</div></div>
          </div>
        )}
        <h1 className="cg-h1" style={{ fontSize: 28 }}>{spec.text.title || 'Untitled'}</h1>
        {spec.text.subtitle && <p className="cg-share-sub">{spec.text.subtitle}</p>}
        <p className="cg-share-caption">{caption}</p>
        <table className="cg-share-table">
          <thead><tr><th scope="col">Label</th><th scope="col">Value</th></tr></thead>
          <tbody>
            {spec.data.map((r) => (
              <tr key={r.id}><td>{r.label}</td><td className="cg-mono">{formatValue(r.value, r.unit, 'number+pct', total)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="cg-share-actions">
          <Button variant="primary" size="lg" onClick={remix} aria-label="Remix with your numbers">Remix with your numbers</Button>
          <Button onClick={download} aria-label="Download PNG">Download PNG</Button>
          <Button variant="ghost" onClick={copyData} aria-label="Copy data">Copy data</Button>
        </div>
        <div className="cg-hint cg-share-foot">
          <p style={{ margin: 0 }}>Made with ChartGenie, free, in the browser.</p>
          <p style={{ margin: '4px 0 0' }}>The remix opens this exact look with the numbers blank{handle ? `, and credits @${handle}` : ''} unless you remove the credit.</p>
        </div>
      </aside>
    </div>
  );
}
