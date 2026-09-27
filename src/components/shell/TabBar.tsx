import { Link, type LinkProps } from '@tanstack/react-router';
import { NAV } from './nav';

const to = (p: string) => p as LinkProps['to'];

export function TabBar(): React.JSX.Element {
  return (
    <nav className="cg-tabbar" aria-label="Primary">
      {NAV.map((n) => (
        <Link key={n.to} to={to(n.to)} className="cg-tab" activeOptions={{ exact: n.to.startsWith('/?'), includeSearch: false }} activeProps={{ 'aria-current': 'page', 'data-on': 'true' }}>
          {n.icon()}
          <span>{n.label}</span>
        </Link>
      ))}
    </nav>
  );
}
