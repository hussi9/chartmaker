import { useEffect, useRef, useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';
import type { ChartDoc } from '../../db';
import { Chart } from '../../chart/render/Chart';
import { POST_SIZES } from '../../chart/types';
import { relativeTime } from '../../lib/time';
import { Button } from '../common/Button';

const to = (p: string) => p as LinkProps['to'];

export interface ChartCardProps { doc: ChartDoc; onDuplicate: (d: ChartDoc) => void; onDelete: (d: ChartDoc) => void }

export function ChartCard({ doc, onDuplicate, onDelete }: ChartCardProps): React.JSX.Element {
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const size = POST_SIZES[doc.spec.size];

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const title = doc.spec.text.title || 'Untitled';
  return (
    <article className="cg-card cg-chartcard" aria-label={title}>
      <div className="cg-chartcard-thumb" style={{ aspectRatio: '16 / 9' }}>
        <div className="cg-chartcard-thumb-inner" style={{ aspectRatio: `${size.w} / ${size.h}`, width: size.w >= size.h ? '100%' : `${Math.round((size.w / size.h) * (9 / 16) * 100)}%` }}>
          <Chart spec={doc.spec} static />
        </div>
      </div>
      <div className="cg-chartcard-foot">
        <div className="cg-chartcard-text">
          <div className="cg-chartcard-name">{title}</div>
          <div className="cg-mono cg-chartcard-meta">
            {doc.spec.size} · edited {relativeTime(doc.updatedAt)}{doc.sharedAt ? <> · <span className="cg-chartcard-shared">shared</span></> : null}
          </div>
        </div>
        <div className="cg-chartcard-actions" ref={wrap}>
          <Button size="sm" variant="ghost" onClick={() => onDuplicate(doc)} aria-label={`Duplicate ${title}`}>Duplicate</Button>
          <Link to={to('/edit/$id')} params={{ id: doc.id } as never} className="cg-btn cg-btn-secondary cg-btn-sm" aria-label={`Open ${title}`}>Open</Link>
          <Button size="sm" variant="ghost" aria-label={`More for ${title}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} icon={<MoreHorizontal size={14} />} />
          {menu && (
            <div role="menu" className="cg-menu" aria-label="More">
              <button type="button" role="menuitem" className="cg-menu-item cg-menu-danger" onClick={() => { setMenu(false); onDelete(doc); }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
