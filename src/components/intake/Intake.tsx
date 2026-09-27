// New chart: paste anything, get three charts. On phones this is the quick-post flow.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearch, type LinkProps } from '@tanstack/react-router';
import { useTopBar } from '../shell/TopBar';
import { useDoc, newId } from '../../store/document';
import { useUi } from '../../store/ui';
import { detect } from '../../insights/intake';
import { detectImage } from '../../insights/detectImage';
import { isEngineReady, ensureEngine } from '../../ocr/engine';
import { suggest } from '../../insights/suggest';
import { insights } from '../../insights';
import { CHART_TYPES, defaultSpec, type ChartSpec, type ChartType, type Unit } from '../../chart/types';
import { PasteBox } from './PasteBox';
import { SuggestionCard } from './SuggestionCard';
import { QuickPost } from './QuickPost';
import { Button } from '../common/Button';
import { track } from '../../lib/gtag';
import './intake.css';

const to = (p: string) => p as LinkProps['to'];

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 20_000;
const TOO_LARGE = 'That picture is too large — try a smaller picture (under 15MB).';
const TOO_SLOW = "That took too long to read. Try again, or paste the numbers instead.";

export function useIntake(initialText = '') {
  const [text, setText] = useState(initialText);
  const [unitOverride, setUnitOverride] = useState<Unit | 'number' | null>(null);
  const [imageState, setImageState] = useState<'idle' | 'loading-engine' | 'reading'>('idle');
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const requestRef = useRef(0);
  const detection = useMemo(() => detect(text), [text]);
  const unit: Unit | 'number' = unitOverride ?? detection.unit ?? 'number';
  const rows = useMemo(() => detection.rows.map((r) => ({ ...r, id: newId(), ...(unit === 'number' ? { unit: undefined } : { unit }) })), [detection.rows, unit]);
  const suggestions = useMemo(() => suggest(rows), [rows]);
  const title = detection.title ?? (detection.columns && detection.columns.length >= 2 ? `${detection.columns[1]} by ${detection.columns[0]}` : 'Untitled');
  const baseSpec = useMemo<ChartSpec>(() => defaultSpec({ data: rows, text: { title }, type: suggestions[0]?.type ?? 'bar' }), [rows, title, suggestions]);
  useEffect(() => { if (detection.rows.length) track('intake_detect', { kind: detection.kind, rows: detection.rows.length }); }, [detection.kind, detection.rows.length]);

  const handleImage = useCallback((file: File) => {
    if (file.size > MAX_IMAGE_BYTES) { setImageWarning(TOO_LARGE); return; }
    setImageWarning(null);
    const myRequest = ++requestRef.current;
    const isMine = () => requestRef.current === myRequest;
    // The first picture in a session pays for a multi-MB model download;
    // every one after that is just the (fast) per-image read. The 20s
    // budget below covers only the read — a slow model download (real on a
    // throttled connection) must not burn the same clock and read as
    // "stuck" (review item I1), so it starts only once ensureEngine()
    // resolves, not when the picture is first picked.
    setImageState(isEngineReady() ? 'reading' : 'loading-engine');
    void ensureEngine().then(
      () => {
        if (!isMine()) return;
        setImageState('reading');
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          if (isMine()) { setImageState('idle'); setImageWarning(TOO_SLOW); }
        }, IMAGE_TIMEOUT_MS);
        void detectImage(file).then((d) => {
          clearTimeout(timer);
          if (timedOut || !isMine()) return; // a newer pick, or already timed out, wins
          setImageState('idle');
          if (d.warnings.length) setImageWarning(d.warnings[0]);
          if (d.rows.length) { setText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); track('intake_detect', { kind: 'image', rows: d.rows.length }); }
        }).catch(() => {
          clearTimeout(timer);
          if (timedOut || !isMine()) return;
          setImageState('idle');
          setImageWarning(TOO_SLOW);
        });
      },
      () => {
        if (isMine()) { setImageState('idle'); setImageWarning(TOO_SLOW); }
      },
    );
  }, []);

  return { text, setText, detection, unit, setUnit: setUnitOverride, rows, suggestions, baseSpec, imageState, imageWarning, handleImage };
}

export function Intake(): React.JSX.Element {
  const search = useSearch({ strict: false }) as { text?: string; url?: string; shared?: boolean };
  const narrow = useUi((s) => s.narrow);
  const navigate = useNavigate();
  const intake = useIntake(search.text ?? search.url ?? '');
  const { detection, rows, suggestions, baseSpec } = intake;
  const ins = useMemo(() => insights(rows), [rows]);

  useEffect(() => {
    useTopBar.getState().set({ crumb: 'New chart' });
    return () => useTopBar.getState().set({ crumb: undefined });
  }, []);

  useEffect(() => {
    if (!search.shared) return;
    void (async () => {
      const { db } = await import('../../db');
      const pending = await db.shareInbox.get('pending');
      if (!pending) { track('share_target_miss', {}); return; }
      await db.shareInbox.delete('pending');
      intake.handleImage(new File([pending.blob], 'shared-image', { type: pending.blob.type || 'image/png' }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.shared]);

  const open = (type: ChartType, rank: number) => {
    const id = useDoc.getState().newDoc({ ...baseSpec, type });
    track('suggestion_use', { type, rank });
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };

  if (narrow) return <QuickPost intake={intake} />;

  return (
    <div className="cg-intake">
      <div className="cg-intake-left">
        <h1 className="cg-h1 cg-intake-h1">Paste anything.<br /><span className="cg-intake-accent">We’ll chart it.</span></h1>
        <PasteBox text={intake.text} onText={intake.setText} detection={detection} unit={intake.unit} onUnit={intake.setUnit} onImage={intake.handleImage} imageState={intake.imageState} imageWarning={intake.imageWarning} />
        <div className="cg-intake-cta">
          <Button variant="primary" size="lg" disabled={rows.length === 0} onClick={() => { const top = suggestions[0]; if (top) open(top.type, 0); }} aria-label="Continue with these rows">Continue with these rows →</Button>
          {rows.length > 0 && <span className="cg-hint">Units: <b>{intake.unit === 'number' ? 'plain numbers' : intake.unit}</b> · change with the control above</span>}
        </div>
        <div className="cg-intake-examples">
          <div><b>Sentence</b><br />“Revenue grew from 12k in Jan to 34k in Jun” → two points, k units, before/after suggested.</div>
          <div><b>Cells</b><br />Copy a label column and a value column from any spreadsheet and paste them together.</div>
          <div><b>CSV</b><br />Drop a .csv or paste comma-separated rows; a header line is detected.</div>
        </div>
      </div>
      <aside className="cg-intake-right" aria-label="Suggestions">
        <div className="cg-intake-right-head">
          <span className="cg-lbl">Suggested for this data</span>
          <span className="cg-hint">All {CHART_TYPES.length} looks are in the editor</span>
        </div>
        {rows.length === 0 ? (
          <p className="cg-hint cg-intake-empty">Paste rows to see suggestions.</p>
        ) : (
          <>
            <ul className="cg-suggestions" aria-label="Suggested charts">
              {suggestions.map((s, i) => <SuggestionCard key={s.type} spec={baseSpec} type={s.type} reason={s.reason} rank={i} onUse={() => open(s.type, i)} />)}
            </ul>
            {ins.length > 0 && <p className="cg-hint cg-intake-insights"><b>Insights found:</b> {ins.slice(0, 3).map((i) => i.text).join(' · ')}. These appear as chips in the editor.</p>}
          </>
        )}
      </aside>
    </div>
  );
}
