import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '../components/shell/Shell';
import { openDb, db } from '../db';
import { migrateFromLocalStorage } from '../db/migrate';
import { useUi } from '../store/ui';

let booted: Promise<void> | null = null;

// Runs once per session: open storage, pull the v1 library in, load the handle.
function boot(): Promise<void> {
  if (!booted) {
    booted = (async () => {
      const storage = await openDb();
      useUi.setState({ storage });
      if (storage === 'ok') {
        await migrateFromLocalStorage();
        const settings = await db.settings.get('settings');
        if (settings?.handle) useUi.setState({ handle: settings.handle });
      }
    })();
  }
  return booted;
}

export const Route = createRootRoute({
  beforeLoad: () => boot(),
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
