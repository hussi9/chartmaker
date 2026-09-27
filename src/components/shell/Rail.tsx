import { Link, type LinkProps } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';
import { NAV } from './nav';
import { useUi } from '../../store/ui';

const to = (p: string) => p as LinkProps['to'];

export function Rail(): React.JSX.Element {
  const handle = useUi((s) => s.handle);
  return (
    <nav className="cg-rail" aria-label="Primary">
      <Link to={to('/')} className="cg-rail-mark" aria-label="ChartGenie home">
        <BarChart3 size={20} strokeWidth={2.4} color="#1e293b" />
      </Link>
      {NAV.map((n) => (
        <Link key={n.to} to={to(n.to)} className="cg-rb" activeOptions={{ exact: n.to.startsWith('/?'), includeSearch: false }} activeProps={{ 'aria-current': 'page', 'data-on': 'true' }}>
          {n.icon()}
          <span>{n.label}</span>
        </Link>
      ))}
      <Link to={to('/brand')} className="cg-rail-handle" title="Your handle appears on every export">
        <span className="cg-rail-avatar" aria-hidden="true">{handle ? handle.charAt(0).toUpperCase() : '?'}</span>
        <span className="cg-rail-handle-text">{handle ? `@${handle}` : 'Set handle'}</span>
      </Link>
    </nav>
  );
}
