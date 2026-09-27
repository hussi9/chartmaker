import type { ReactNode } from 'react';
import { create } from 'zustand';
import { Link, type LinkProps } from '@tanstack/react-router';

const home = '/' as LinkProps['to'];

// Routes publish their breadcrumb and actions into the top bar.
interface TopBarState { crumb?: ReactNode; status?: ReactNode; actions?: ReactNode; set(next: Partial<Omit<TopBarState, 'set'>>): void }
export const useTopBar = create<TopBarState>()((set) => ({ set: (next) => set(next) }));

export function TopBar(): React.JSX.Element {
  const { crumb, status, actions } = useTopBar();
  return (
    <header className="cg-topbar" role="banner">
      <Link to={home} className="cg-brand">ChartGenie</Link>
      {crumb && (<><span className="cg-crumb-sep" aria-hidden="true">/</span><span className="cg-crumb">{crumb}</span></>)}
      {status && <span className="cg-topbar-status">{status}</span>}
      <div className="cg-topbar-actions">{actions}</div>
    </header>
  );
}
