import { createFileRoute } from '@tanstack/react-router';
import { Intake } from '../components/intake/Intake';
import { stringParam } from '../lib/searchParams';
import { trackPageView } from '../lib/gtag';

// ?text= and ?url= arrive from the Web Share Target (share sheet → ChartGenie).
export const Route = createFileRoute('/new')({
  component: Intake,
  validateSearch: (s: Record<string, unknown>): { text?: string; url?: string } => ({
    text: stringParam(s, 'text', 20_000),
    url: stringParam(s, 'url', 2_000),
  }),
  onEnter: () => trackPageView('/new'),
  head: () => ({ meta: [{ title: 'New chart — ChartGenie' }] }),
});
