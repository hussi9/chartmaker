import { createFileRoute, redirect } from '@tanstack/react-router';
import { Templates } from '../components/gallery/Templates';
import { trackPageView } from '../lib/gtag';
import { db } from '../db';
import { useUi } from '../store/ui';
import { boolParam } from '../lib/searchParams';

// Returning people (anyone with a saved chart) land on the intake screen; the
// Templates tab links here with ?templates=1 so the gallery stays one tap away.
export const Route = createFileRoute('/')({
  component: Templates,
  validateSearch: (s: Record<string, unknown>): { templates?: boolean } => ({ templates: boolParam(s, 'templates') || undefined }),
  beforeLoad: async ({ search }) => {
    if (search.templates || useUi.getState().storage !== 'ok') return;
    const n = await db.charts.count().catch(() => 0);
    if (n > 0) throw redirect({ to: '/new' as never });
  },
  onEnter: () => trackPageView('/'),
});
