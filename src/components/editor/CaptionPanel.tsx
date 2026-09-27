// The post caption: drafted on the device from the title and insights, in three
// tones. The browser's built-in model (when present) can rewrite it; nothing is
// ever sent to a server.
import { useEffect, useMemo, useState } from 'react';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { insights } from '../../insights';
import { captionFrom } from '../../caption/templates';
import { hasBuiltinModel, tryBuiltinModel } from '../../caption/builtin';
import type { Tone } from '../../chart/types';
import { Button } from '../common/Button';
import { Chip } from '../common/Chip';
import { Seg } from '../common/Seg';

const TONES: { value: Tone; label: string }[] = [{ value: 'plain', label: 'Plain' }, { value: 'punchy', label: 'Punchy' }, { value: 'analyst', label: 'Analyst' }];

export function hashtagsFor(title: string, labels: string[]): string {
  const words = [title, ...labels.slice(0, 2)]
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]+/g, ''))
    .filter((w) => w.length >= 3);
  return [...new Set(['chart', 'data', ...words])].slice(0, 5).map((w) => `#${w}`).join(' ');
}

export function CaptionPanel(): React.JSX.Element {
  const spec = useDoc((s) => s.spec);
  const setSpec = useDoc((s) => s.setSpec);
  const toast = useUi((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const ins = useMemo(() => insights(spec.data), [spec.data]);
  const tone = spec.caption?.tone ?? useUi.getState().tone;
  const draft = useMemo(() => captionFrom(spec, ins, tone), [spec, ins, tone]);
  const edited = spec.caption?.edited ?? false;
  const text = edited ? spec.caption!.text : draft;
  const [tags, setTags] = useState(false);
  const modelAvailable = hasBuiltinModel();

  // Keep the stored caption in step with the draft while it has not been hand-edited.
  useEffect(() => {
    if (edited) return;
    if (spec.caption?.text === draft && spec.caption?.tone === tone) return;
    setSpec((d) => { d.caption = { text: draft, tone, edited: false }; });
  }, [draft, tone, edited, spec.caption?.text, spec.caption?.tone, setSpec]);

  const setTone = (t: Tone) => {
    useUi.setState({ tone: t });
    setSpec((d) => { d.caption = { text: d.caption?.edited ? d.caption.text : captionFrom(d, ins, t), tone: t, edited: d.caption?.edited ?? false }; });
  };

  const onEdit = (value: string) => setSpec((d) => { d.caption = { text: value, tone, edited: true }; });
  const reset = () => setSpec((d) => { d.caption = { text: captionFrom(d, ins, tone), tone, edited: false }; });

  const copy = async () => {
    const out = tags ? `${text}\n\n${hashtagsFor(spec.text.title, spec.data.map((r) => r.label))}` : text;
    try { await navigator.clipboard.writeText(out); toast('Caption copied'); } catch { toast('Could not copy the caption.'); }
  };

  const toggleTags = () => {
    const next = !tags;
    setTags(next);
    const base = text.replace(/\n\n#[^\n]*$/, '');
    onEdit(next ? `${base}\n\n${hashtagsFor(spec.text.title, spec.data.map((r) => r.label))}` : base);
  };

  const regenerate = async () => {
    setBusy(true);
    const prompt = `Rewrite this social post caption in a ${tone} tone, one or two sentences, no hashtags, keep every number exactly:\n\nTitle: ${spec.text.title}\nFacts: ${ins.map((i) => i.text).join('; ')}\nDraft: ${draft}`;
    const out = await tryBuiltinModel(prompt, 3000);
    setBusy(false);
    if (out) onEdit(out); else toast('The on-device model did not answer; keeping the draft.');
  };

  return (
    <div className="cg-cell cg-caption">
      <span className="cg-lbl">Caption draft · {tone}</span>
      <textarea className="cg-textarea cg-caption-box" aria-label="Caption" rows={4} value={text} onChange={(e) => onEdit(e.target.value)} maxLength={2000} />
      <Seg<Tone> label="Tone" size="sm" value={tone} options={TONES} onChange={setTone} />
      <div className="cg-chips">
        <Chip on={tags} onClick={toggleTags} aria-label={tags ? 'Remove hashtags' : 'Add hashtags'}>{tags ? '− hashtags' : '+ hashtags'}</Chip>
        {edited && <Chip onClick={reset} aria-label="Reset to draft">Reset to draft</Chip>}
        {modelAvailable && <Chip tint onClick={regenerate} disabled={busy} aria-label="Regenerate with the on-device model">{busy ? 'Thinking…' : 'Regenerate'}</Chip>}
      </div>
      <div className="cg-caption-actions">
        <Button size="sm" onClick={copy} aria-label="Copy caption">Copy</Button>
        <span className="cg-hint">{modelAvailable ? 'Drafted on your device; the built-in model can rewrite it.' : 'Drafted on your device from the title and the facts.'}</span>
      </div>
    </div>
  );
}
