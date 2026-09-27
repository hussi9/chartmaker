import { createFileRoute } from '@tanstack/react-router';
import { Intake } from '../components/intake/Intake';
import { boolParam, stringParam } from '../lib/searchParams';
import { trackPageView } from '../lib/gtag';

// ?text= and ?url= arrive from the Web Share Target (share sheet → ChartGenie).
// ?shared=1 means a photo was shared via the POST share target (src/sw.ts)
// and is waiting in the shareInbox table for Intake to pick up.
export const Route = createFileRoute('/new')({
  component: Intake,
  validateSearch: (s: Record<string, unknown>): { text?: string; url?: string; shared?: boolean } => ({
    text: stringParam(s, 'text', 20_000),
    url: stringParam(s, 'url', 2_000),
    shared: boolParam(s, 'shared') || undefined,
  }),
  onEnter: () => trackPageView('/new'),
  head: () => ({ meta: [{ title: 'New chart — ChartGenie' }] }),
});
