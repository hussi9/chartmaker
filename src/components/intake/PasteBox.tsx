// "Paste anything": a big box that detects rows as you type, drop or pick a
// CSV, or add a picture (read on-device — see src/insights/detectImage.ts).
import { useRef, type DragEvent } from 'react';
import type { Detection } from '../../insights/intake';
import { detectCsvFile } from '../../insights/intake';
import { SAMPLE_ROWS, type Unit } from '../../chart/types';
import { Chip } from '../common/Chip';
import { Seg } from '../common/Seg';

const UNIT_OPTIONS: { value: Unit | 'number'; label: string; title: string }[] = [
  { value: 'number', label: '123', title: 'Plain numbers' },
  { value: 'percent', label: '%', title: 'Percent' },
  { value: 'currency', label: '$', title: 'Currency' },
  { value: 'compact', label: 'k / M', title: 'Thousands and millions' },
];

export interface PasteBoxProps {
  text: string;
  onText: (t: string) => void;
  detection: Detection;
  unit: Unit | 'number';
  onUnit: (u: Unit | 'number') => void;
  compact?: boolean;
  onImage?: (file: File) => void;
  imageState?: 'idle' | 'loading-engine' | 'reading';
  imageWarning?: string | null;
  // Owned by the caller (useIntake), not this component — both a hand-picked
  // image and one hydrated from a shared picture set the same File there, so
  // either path shows a thumbnail here (review item I4).
  thumbUrl?: string | null;
}

export function sampleText(): string {
  return SAMPLE_ROWS.map((r) => `${r.label.padEnd(10)} ${r.value}`).join('\n');
}

export function PasteBox({ text, onText, detection, unit, onUnit, compact, onImage, imageState = 'idle', imageWarning, thumbUrl }: PasteBoxProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const kinds: { id: Detection['kind']; label: string }[] = [{ id: 'cells', label: 'Cells' }, { id: 'sentence', label: 'Sentence' }, { id: 'csv', label: 'CSV' }];

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) { onImage?.(file); return; }
    if (file) { const d = await detectCsvFile(file); onText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); return; }
    const t = e.dataTransfer.getData('text');
    if (t) onText(t);
  };

  const summary = detection.rows.length
    ? `Detected: ${detection.rows.length} rows · numbers · labels${detection.unit ? ` · ${detection.unit}` : ''}`
    : text.trim() ? 'No rows found yet — paste label and value pairs' : '';

  return (
    <div className={`cg-pastebox ${compact ? 'cg-pastebox-compact' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {imageState === 'loading-engine' && <span className="cg-callout" aria-live="polite">Setting up picture reading… (one-time, a few MB)</span>}
      {imageState === 'reading' && <span className="cg-callout" aria-live="polite">Reading your picture…</span>}
      {summary && imageState === 'idle' && !thumbUrl && <span className="cg-callout" aria-live="polite">{summary}</span>}
      {thumbUrl && (
        <div className="cg-pastebox-image-row">
          <img src={thumbUrl} alt="Picture you added" className="cg-pastebox-thumb" />
          {summary && imageState === 'idle' && <span className="cg-hint">{summary}</span>}
        </div>
      )}
      <textarea
        className="cg-pastebox-input"
        aria-label="Paste your numbers"
        placeholder={'USA        87\nItaly      20\nUK         12\nIreland    15'}
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={compact ? 6 : 8}
        autoFocus={!compact}
      />
      <div className="cg-pastebox-foot">
        <div className="cg-chips">
          {kinds.map((k) => <Chip key={k.id} tint={detection.kind === k.id} aria-pressed={detection.kind === k.id} onClick={() => fileRef.current && k.id === 'csv' && fileRef.current.click()} title={k.id === 'csv' ? 'Pick a CSV file' : `Paste ${k.label.toLowerCase()}`}>{k.label}</Chip>)}
          <Chip tint={detection.kind === 'image'} onClick={() => imageFileRef.current?.click()} title="Add a picture of a table">Picture</Chip>
        </div>
        <span className="cg-hint">or try <button type="button" className="cg-linkbtn" onClick={() => onText(sampleText())}>sample data</button></span>
      </div>
      {detection.rows.length > 0 && (
        <div className="cg-pastebox-units">
          <span className="cg-hint">Units</span>
          <Seg label="Units" size="sm" value={unit} options={UNIT_OPTIONS} onChange={onUnit} />
        </div>
      )}
      {detection.warnings.map((w) => <span key={w} className="cg-hint cg-warn">{w}</span>)}
      {imageWarning && <span className="cg-hint cg-warn">{imageWarning}</span>}
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden aria-label="CSV file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const d = await detectCsvFile(f); onText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); e.target.value = ''; }} />
      <input ref={imageFileRef} type="file" accept="image/*" capture="environment" hidden aria-label="Picture file" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage?.(f); e.target.value = ''; }} />
    </div>
  );
}
