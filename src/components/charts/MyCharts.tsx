// My charts: a shelf, not a list. Real thumbnails, last edit, shared status,
// duplicate to re-post the same look with next month's numbers.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, type LinkProps } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { db, type ChartDoc } from '../../db';
import { exportBackup, importBackup, BackupError } from '../../db/backup';
import { useDoc, newId } from '../../store/document';
import { useUi } from '../../store/ui';
import { useTopBar } from '../shell/TopBar';
import { POST_SIZE_IDS, type PostSizeId } from '../../chart/types';
import { downloadBlob } from '../../export/png';
import { relativeTime } from '../../lib/time';
import { Chip } from '../common/Chip';
import { Button } from '../common/Button';
import { ChartCard } from './ChartCard';
import './charts.css';

const to = (p: string) => p as LinkProps['to'];
const STALE_DAYS = 28;

export function MyCharts(): React.JSX.Element {
  const navigate = useNavigate();
  const narrow = useUi((s) => s.narrow);
  const storage = useUi((s) => s.storage);
  const toast = useUi((s) => s.toast);
  const [docs, setDocs] = useState<ChartDoc[]>([]);
  const [filter, setFilter] = useState<'all' | 'shared'>('all');
  const [size, setSize] = useState<PostSizeId | null>(null);
  const [pendingRestore, setPendingRestore] = useState<File | null>(null);

  const reload = useCallback(async () => {
    if (storage !== 'ok') return;
    setDocs(await db.charts.orderBy('updatedAt').reverse().toArray());
  }, [storage]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    useTopBar.getState().set({ crumb: 'My charts', actions: <Link to={to('/new')} className="cg-btn cg-btn-primary"><Plus size={14} aria-hidden="true" /> New chart</Link> });
    return () => useTopBar.getState().set({ crumb: undefined, actions: undefined });
  }, []);

  const shown = useMemo(() => docs.filter((d) => (filter === 'shared' ? Boolean(d.sharedAt) : true) && (size ? d.spec.size === size : true)), [docs, filter, size]);
  const shared = useMemo(() => docs.filter((d) => d.sharedUrl), [docs]);
  const stale = useMemo(() => docs.find((d) => Date.now() - d.updatedAt > STALE_DAYS * 86_400_000), [docs]);

  const duplicate = async (d: ChartDoc) => {
    const id = useDoc.getState().openSpec({ ...d.spec, text: { ...d.spec.text, title: `${d.spec.text.title || 'Untitled'} copy` } }, newId());
    await useDoc.getState().save();
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };

  const remove = async (d: ChartDoc) => {
    await db.charts.delete(d.id);
    await reload();
    toast(`Deleted “${d.spec.text.title || 'Untitled'}”`, { label: 'Undo', run: () => { void db.charts.put(d).then(reload); } });
  };

  const backup = async () => {
    try {
      downloadBlob(await exportBackup(), `chartgenie-backup-${new Date().toISOString().slice(0, 10)}.json`);
      toast('Backup downloaded');
    } catch (e) { toast(`Backup failed: ${e instanceof Error ? e.message : 'unknown error'}.`); }
  };

  const restore = async (file: File, mode: 'merge' | 'replace') => {
    setPendingRestore(null);
    try {
      const r = await importBackup(file, mode);
      await reload();
      toast(`Restored ${r.charts} chart${r.charts === 1 ? '' : 's'}${r.series ? ` and ${r.series} series` : ''}.`);
    } catch (e) { toast(e instanceof BackupError ? e.message : 'Could not restore that file.'); }
  };

  if (storage !== 'ok') {
    return (
      <section className="cg-page">
        <h1 className="cg-h1" style={{ fontSize: 40 }}>My charts</h1>
        <p className="cg-hint" style={{ fontSize: 14 }}>This browser is not letting ChartGenie save. You can still make and export charts; they just won’t be kept here.</p>
      </section>
    );
  }

  return (
    <div className="cg-page cg-mycharts">
      <div className="cg-mycharts-head">
        <h1 className="cg-h1" style={{ fontSize: narrow ? 30 : 40 }}>My charts</h1>
        <span className="cg-hint cg-mycharts-note">
          Saved in this browser · <button type="button" className="cg-linkbtn" onClick={backup}>export a backup</button> · <label className="cg-linkbtn cg-restore">restore<input type="file" accept="application/json,.json" hidden aria-label="Restore a backup" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (docs.length === 0) void restore(f, 'replace'); else setPendingRestore(f); } e.target.value = ''; }} /></label>
        </span>
      </div>
      <div className="cg-chips" role="group" aria-label="Filters">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>All · {docs.length}</Chip>
        <Chip on={filter === 'shared'} onClick={() => setFilter('shared')}>Shared · {docs.filter((d) => d.sharedAt).length}</Chip>
        {POST_SIZE_IDS.map((s) => <Chip key={s} on={size === s} onClick={() => setSize(size === s ? null : s)}>{s}</Chip>)}
      </div>
      {docs.length === 0 ? (
        <section className="cg-card cg-mycharts-empty">
          <span className="cg-lbl">Nothing here yet</span>
          <span className="cg-lookcard-blank-title">No charts yet</span>
          <span className="cg-hint">Pick a look or paste your numbers. Every chart you open is autosaved here.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={to('/?templates=1')} className="cg-btn cg-btn-primary">Pick a look</Link>
            <Link to={to('/new')} className="cg-btn">Paste numbers</Link>
          </div>
        </section>
      ) : (
        <div className={`cg-mycharts-grid ${narrow ? 'cg-mycharts-grid-narrow' : ''}`}>
          {shown.map((d) => <ChartCard key={d.id} doc={d} onDuplicate={duplicate} onDelete={remove} />)}
          {stale && (
            <section className="cg-card cg-lookcard-blank cg-mycharts-habit" aria-label="Monthly habit">
              <span className="cg-lbl">Monthly habit</span>
              <span className="cg-lookcard-blank-title">Duplicate last month’s chart, paste new numbers</span>
              <span className="cg-hint">Same look, same size, same handle. Two minutes to post.</span>
              <Button onClick={() => duplicate(stale)} aria-label={`Duplicate “${stale.spec.text.title || 'Untitled'}”`}>Duplicate “{stale.spec.text.title || 'Untitled'}”</Button>
            </section>
          )}
        </div>
      )}
      {pendingRestore && (
        <div className="cg-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPendingRestore(null); }}>
          <div className="cg-dialog" role="dialog" aria-modal="true" aria-labelledby="cg-restore-title">
            <h2 id="cg-restore-title" className="cg-dialog-title">Restore “{pendingRestore.name}”</h2>
            <p className="cg-dialog-body">You already have {docs.length} chart{docs.length === 1 ? '' : 's'} here. Merge keeps them and adds the backup’s charts; Replace removes them first.</p>
            <div className="cg-dialog-actions">
              <Button variant="ghost" onClick={() => setPendingRestore(null)}>Cancel</Button>
              <Button onClick={() => restore(pendingRestore, 'replace')} aria-label="Replace everything with the backup">Replace</Button>
              <Button variant="primary" onClick={() => restore(pendingRestore, 'merge')} aria-label="Merge the backup with existing charts">Merge</Button>
            </div>
          </div>
        </div>
      )}
      {shared.length > 0 && (
        <section className="cg-sharedlinks">
          <span className="cg-lbl">Shared links</span>
          <table className="cg-sharedlinks-table" aria-label="Shared links">
            <thead><tr><th scope="col">Link</th><th scope="col">Chart</th><th scope="col">Copied</th><th scope="col"><span className="cg-visually-hidden">Action</span></th></tr></thead>
            <tbody>
              {shared.map((d) => (
                <tr key={d.id}>
                  <td className="cg-mono cg-sharedlinks-url">{d.sharedUrl}</td>
                  <td>{d.spec.text.title || 'Untitled'}</td>
                  <td className="cg-hint">{relativeTime(d.sharedAt ?? d.updatedAt)}</td>
                  <td><Button size="sm" variant="ghost" aria-label={`Copy link for ${d.spec.text.title || 'Untitled'}`} onClick={async () => { try { await navigator.clipboard.writeText(d.sharedUrl!); toast('Link copied'); } catch { toast('Could not copy.'); } }}>Copy</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
