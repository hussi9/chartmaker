// The front door: finished looks with sample numbers inside. One click opens
// the editor with those numbers to overwrite.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, type LinkProps } from '@tanstack/react-router';
import { Search, Plus } from 'lucide-react';
import { useTopBar } from '../shell/TopBar';
import { useDoc } from '../../store/document';
import { useUi } from '../../store/ui';
import { db, type ChartDoc } from '../../db';
import { TEMPLATE_CATEGORIES, filterTemplates, type Template, type TemplateCategory } from '../../chart/templates';
import { SAMPLE_ROWS } from '../../chart/types';
import { Chart } from '../../chart/render/Chart';
import { Chip } from '../common/Chip';
import { Button } from '../common/Button';
import { LookCard } from './LookCard';
import { track } from '../../lib/gtag';
import { relativeTime } from '../../lib/time';
import './gallery.css';

const to = (p: string) => p as LinkProps['to'];

export function Templates(): React.JSX.Element {
  const navigate = useNavigate();
  const narrow = useUi((s) => s.narrow);
  const storage = useUi((s) => s.storage);
  const [cat, setCat] = useState<TemplateCategory | 'popular' | 'all'>('popular');
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ChartDoc[]>([]);
  const list = useMemo(() => filterTemplates(query ? 'all' : cat, query), [cat, query]);

  useEffect(() => {
    if (storage !== 'ok') return;
    let live = true;
    void db.charts.orderBy('updatedAt').reverse().limit(3).toArray().then((docs) => { if (live) setRecent(docs); });
    return () => { live = false; };
  }, [storage]);

  const open = (spec: Template['spec'], type: Template['type']) => {
    const id = useDoc.getState().newDoc({ ...spec, data: spec.data.map((r) => ({ ...r })) });
    track('template_use', { type });
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };
  const blank = () => {
    const id = useDoc.getState().newDoc({ data: SAMPLE_ROWS.map((r) => ({ ...r })) });
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };

  useEffect(() => {
    useTopBar.getState().set({
      crumb: 'Templates',
      actions: (
        <>
          <Link to={to('/new')} className="cg-btn cg-btn-ghost">Paste numbers</Link>
          <Button variant="primary" icon={<Plus size={14} />} onClick={blank}>Blank chart</Button>
        </>
      ),
    });
    return () => useTopBar.getState().set({ crumb: undefined, actions: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cg-page cg-templates">
      <div className="cg-templates-head">
        <h1 className="cg-h1 cg-templates-h1">Pick a look.<br />Swap in your numbers.</h1>
        <label className="cg-search">
          <Search size={14} aria-hidden="true" />
          <input type="search" role="searchbox" className="cg-search-input" placeholder="Search looks: funnel, growth, before/after…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search looks" />
        </label>
      </div>
      <div className="cg-chips" role="group" aria-label="Categories">
        {TEMPLATE_CATEGORIES.map((c) => <Chip key={c.id} on={!query && cat === c.id} onClick={() => { setQuery(''); setCat(c.id); }}>{c.label}</Chip>)}
      </div>
      <div className={`cg-gallery ${narrow ? 'cg-gallery-narrow' : ''}`}>
        {list.map((t, i) => <LookCard key={t.id} t={t} onUse={(x) => open(x.spec, x.type)} featured={i === 0 && cat === 'popular' && !query} />)}
        <article className="cg-card cg-lookcard cg-lookcard-blank" aria-label="Start blank">
          <span className="cg-lbl">Nothing fits?</span>
          <span className="cg-lookcard-blank-title">Start blank with sample data</span>
          <span className="cg-hint">Four rows are pre-filled so the chart is never empty.</span>
          <Button onClick={blank} aria-label="Start blank with sample data">Open editor</Button>
        </article>
        {list.length === 0 && <p className="cg-hint">No look matches “{query}”. Try “bars”, “trend” or “funnel”.</p>}
      </div>
      {recent.length > 0 && (
        <section className="cg-recent" aria-label="Recent">
          <div className="cg-recent-head"><span className="cg-lbl">Recent</span><span className="cg-recent-title">Pick up where you left</span></div>
          <div className="cg-recent-list">
            {recent.map((d) => (
              <Link key={d.id} to={to('/edit/$id')} params={{ id: d.id } as never} className="cg-card cg-recent-card">
                <span className="cg-recent-thumb"><Chart spec={d.spec} static /></span>
                <span>
                  <span className="cg-recent-name">{d.spec.text.title || 'Untitled'}</span>
                  <span className="cg-mono cg-recent-meta">{d.spec.size} · {relativeTime(d.updatedAt)}</span>
                </span>
              </Link>
            ))}
          </div>
          <Link to={to('/charts')} className="cg-btn cg-btn-ghost">All my charts →</Link>
        </section>
      )}
    </div>
  );
}
