// Phone: paste → see three charts → pick size and look → share image + caption.
// The full editor is always one tap away.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, type LinkProps } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';
import type { useIntake } from './Intake';
import { PasteBox } from './PasteBox';
import { Chart } from '../../chart/render/Chart';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { PLOTS } from '../../chart/plots';
import { checks } from '../../chart/checks';
import { insights } from '../../insights';
import { captionFrom } from '../../caption/templates';
import { altText } from '../../chart/alt';
import { canvasMeasurer } from '../../chart/measure';
import { type LookId, type PostSizeId } from '../../chart/types';
import { Chip } from '../common/Chip';
import { Button } from '../common/Button';
import { sharePng, pngBlob, downloadBlob } from '../../export/png';
import { buildExportSet, exportFileStem } from '../../export/exportSet';
import { track } from '../../lib/gtag';

const to = (p: string) => p as LinkProps['to'];
const SIZES: PostSizeId[] = ['1:1', '9:16', '16:9'];
const LOOKS: { id: LookId; label: string }[] = [{ id: 'clean', label: 'Clean' }, { id: 'dark', label: 'Dark' }];

export function QuickPost({ intake }: { intake: ReturnType<typeof useIntake> }): React.JSX.Element {
  const navigate = useNavigate();
  const toast = useUi((s) => s.toast);
  const doc = useDoc();
  const [step, setStep] = useState<'paste' | 'pick'>('paste');
  const [menu, setMenu] = useState(false);
  const measure = useMemo(() => canvasMeasurer(), []);
  const { rows, suggestions, baseSpec, detection } = intake;

  const start = () => {
    const top = suggestions[0];
    if (!top) return;
    useDoc.getState().newDoc({ ...baseSpec, size: '1:1', type: top.type });
    setStep('pick');
  };

  const spec = doc.spec;
  const ins = useMemo(() => insights(spec.data), [spec.data]);
  const caption = spec.caption?.text ?? captionFrom(spec, ins, 'punchy');
  const ready = useMemo(() => (step === 'pick' ? checks(spec, [spec.size], ['x', 'linkedin', 'instagram'], measure, ins).every((c) => c.pass) : false), [spec, step, measure, ins]);

  useEffect(() => { if (step === 'pick' && !spec.caption) doc.setSpec((d) => { d.caption = { text: caption, tone: 'punchy', edited: false }; }); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => {
    const name = `${exportFileStem(spec.text.title)}-${spec.size.replace(':', 'x')}.png`;
    try {
      const result = await sharePng(spec, spec.size, caption, name);
      if (result === 'shared') { track('export_one', { format: 'png' }); return; }
      downloadBlob(await pngBlob(spec, spec.size), name);
      try { await navigator.clipboard.writeText(caption); } catch { /* clipboard may be blocked */ }
      toast('Image saved and caption copied. Sharing from the sheet needs a newer browser.');
      track('export_one', { format: 'png' });
    } catch (e) {
      toast(`Could not share: ${e instanceof Error ? e.message : 'unknown error'}.`);
    }
  };

  const exportSet = async () => {
    setMenu(false);
    try {
      const zip = await buildExportSet(spec, ['16:9', '1:1', '9:16'], caption, altText(spec, ins));
      downloadBlob(zip, `${exportFileStem(spec.text.title)}-export-set.zip`);
      track('export_set', { sizes: 3, formats: 'png+svg' });
    } catch (e) { toast(`Export failed: ${e instanceof Error ? e.message : 'unknown error'}.`); }
  };

  if (step === 'paste') {
    return (
      <div className="cg-quick">
        <h1 className="cg-h1" style={{ fontSize: 30 }}>Paste your numbers</h1>
        <PasteBox compact text={intake.text} onText={intake.setText} detection={detection} unit={intake.unit} onUnit={intake.setUnit} onImage={intake.handleImage} imageState={intake.imageState} imageWarning={intake.imageWarning} thumbUrl={intake.thumbUrl} />
        <Button variant="primary" size="lg" className="cg-quick-cta" disabled={rows.length === 0} onClick={start} aria-label="See 3 charts">See 3 charts →</Button>
      </div>
    );
  }

  return (
    <div className="cg-quick">
      <div className="cg-quick-top">
        <button type="button" className="cg-linkbtn" onClick={() => setStep('paste')}>← Numbers</button>
        <span className={`cg-chip cg-chip-status ${ready ? 'cg-chip-tint' : ''}`}>{ready ? 'Post-ready ✓' : 'Checks pending'}</span>
      </div>
      <div className="cg-chips" role="group" aria-label="Post size">
        {SIZES.map((s) => <Chip key={s} on={spec.size === s} onClick={() => doc.setSpec((d) => { d.size = s; })}>{s}</Chip>)}
      </div>
      <div className="cg-quick-art" style={{ boxShadow: 'var(--shadow-artboard)' }}><Chart spec={spec} /></div>
      <div className="cg-chips cg-quick-scroll" role="group" aria-label="Look">
        {suggestions.map((s) => <Chip key={s.type} on={spec.type === s.type} onClick={() => doc.setSpec((d) => { d.type = s.type; })}>{PLOTS[s.type].name}</Chip>)}
        {LOOKS.map((l) => <Chip key={l.id} on={spec.look === l.id} onClick={() => doc.setSpec((d) => { d.look = l.id; })}>{l.label}</Chip>)}
      </div>
      <div className="cg-quick-caption">
        <textarea className="cg-textarea" aria-label="Caption" rows={3} value={caption} onChange={(e) => doc.setSpec((d) => { d.caption = { text: e.target.value, tone: 'punchy', edited: true }; })} />
      </div>
      <div className="cg-quick-actions">
        <Button variant="primary" size="lg" onClick={share} aria-label="Share image + caption" style={{ flex: 1, justifyContent: 'center' }}>Share image + caption</Button>
        <div className="cg-import">
          <Button size="lg" aria-label="More actions" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} icon={<MoreHorizontal size={18} />} />
          {menu && (
            <div role="menu" className="cg-menu cg-menu-up" aria-label="More">
              <button type="button" role="menuitem" className="cg-menu-item" onClick={() => { setMenu(false); void navigate({ to: to('/edit/$id'), params: { id: doc.id } } as never); }}>Open full editor</button>
              <button type="button" role="menuitem" className="cg-menu-item" onClick={async () => { setMenu(false); await doc.save(); toast(useDoc.getState().saveState === 'saved' ? 'Saved to My charts' : 'Not saved in this browser'); }}>Save</button>
              <button type="button" role="menuitem" className="cg-menu-item" onClick={exportSet}>Export set (zip)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
