import { useEffect, type ReactNode } from 'react';
import { Rail } from './Rail';
import { TabBar } from './TabBar';
import { TopBar } from './TopBar';
import { Toasts } from '../common/Toast';
import { NARROW_QUERY, useUi } from '../../store/ui';
import '../../shell.css';

export function Shell({ children }: { children: ReactNode }): React.JSX.Element {
  const narrow = useUi((s) => s.narrow);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(NARROW_QUERY);
    const apply = () => useUi.setState({ narrow: mq.matches });
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  return (
    <div className={`cg-shell ${narrow ? 'cg-shell-narrow' : ''}`}>
      {!narrow && <Rail />}
      <div className="cg-main">
        <TopBar />
        <main className="cg-content">{children}</main>
      </div>
      {narrow && <TabBar />}
      <Toasts />
    </div>
  );
}
