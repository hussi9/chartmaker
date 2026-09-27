import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { db } from '../../db';
import { PaletteRow } from '../common/Palette';
import { Seg } from '../common/Seg';
import { Toggle } from '../common/Toggle';
import type { Palette, ValuesMode } from '../../chart/types';

type RuleKind = 'none' | 'avg' | 'value';

export function StylePanel({ brandPalette }: { brandPalette?: Palette }): React.JSX.Element {
  const spec = useDoc((s) => s.spec);
  const setSpec = useDoc((s) => s.setSpec);
  const storage = useUi((s) => s.storage);
  const rule: RuleKind = spec.options.rule?.kind ?? 'none';

  const setHandle = (raw: string) => {
    const handle = raw.replace(/^@/, '').replace(/\s+/g, '').slice(0, 40);
    setSpec((d) => { d.options.handle = handle || undefined; });
    useUi.setState({ handle: handle || undefined });
    if (storage === 'ok') void db.settings.get('settings').then((s) => db.settings.put({ ...(s ?? { id: 'settings' }), handle: handle || undefined }));
  };

  return (
    <div className="cg-stylepanel">
      <div className="cg-cell">
        <span className="cg-lbl">Palette</span>
        <PaletteRow value={spec.palette} extra={brandPalette ? [brandPalette] : []} onChange={(colors) => setSpec((d) => { d.palette = colors; for (const r of d.data) delete r.color; })} />
      </div>
      <div className="cg-cell">
        <span className="cg-lbl">Values</span>
        <Seg<ValuesMode> label="Values" value={spec.values} onChange={(v) => setSpec((d) => { d.values = v; })} options={[{ value: 'number+pct', label: 'Number + %' }, { value: 'number', label: 'Number' }, { value: 'none', label: 'None' }]} />
      </div>
      <div className="cg-cell">
        <Toggle label="Legend" checked={spec.options.legend} onChange={(v) => setSpec((d) => { d.options.legend = v; })} />
        <Toggle label="Grid lines" checked={spec.options.grid} onChange={(v) => setSpec((d) => { d.options.grid = v; })} />
        <Toggle label="Depth (3D)" checked={spec.options.depth} onChange={(v) => setSpec((d) => { d.options.depth = v; })} />
      </div>
      <div className="cg-cell">
        <span className="cg-lbl">Rule line</span>
        <Seg<RuleKind> label="Rule line" value={rule} onChange={(k) => setSpec((d) => { d.options.rule = k === 'none' ? undefined : k === 'avg' ? { kind: 'avg' } : { kind: 'value', value: d.options.rule?.kind === 'value' ? d.options.rule.value : 0 }; })} options={[{ value: 'none', label: 'None' }, { value: 'avg', label: 'Average' }, { value: 'value', label: 'Value' }]} />
        {spec.options.rule?.kind === 'value' && (
          <input className="cg-input" aria-label="Rule value" inputMode="decimal" value={spec.options.rule.value} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setSpec((d) => { d.options.rule = { kind: 'value', value: v }; }); }} />
        )}
      </div>
      <div className="cg-cell">
        <Toggle label="Show my handle" checked={spec.options.showHandle} onChange={(v) => setSpec((d) => { d.options.showHandle = v; })} />
        <input className="cg-input" aria-label="Handle" placeholder="@yourhandle" value={spec.options.handle ? `@${spec.options.handle}` : ''} onChange={(e) => setHandle(e.target.value)} />
        <span className="cg-hint">Shown top-right on every export.</span>
      </div>
      {spec.options.remixedFrom && (
        <div className="cg-cell">
          <Toggle label={`Credit “remixed from @${spec.options.remixedFrom}”`} checked onChange={() => setSpec((d) => { delete d.options.remixedFrom; })} />
        </div>
      )}
    </div>
  );
}
