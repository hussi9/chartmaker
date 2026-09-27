import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { legacyHashRedirect } from '../lib/legacyLink';
import { Shell } from '../components/shell/Shell';
import { boot } from '../lib/boot';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const legacy = legacyHashRedirect(location);
    if (legacy) throw redirect(legacy as never);
    return boot();
  },
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
