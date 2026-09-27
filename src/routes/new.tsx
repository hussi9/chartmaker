import { createFileRoute } from '@tanstack/react-router';
import { Intake } from '../components/intake/Intake';
import { trackPageView } from '../lib/gtag';

// ?text= and ?url= arrive from the Web Share Target (share sheet → ChartGenie).
export const Route = createFileRoute('/new')({
  component: Intake,
  validateSearch: (s: Record<string, unknown>): { text?: string; url?: string } => ({
    text: typeof s.text === 'string' ? s.text.slice(0, 20_000) : undefined,
    url: typeof s.url === 'string' ? s.url.slice(0, 2_000) : undefined,
  }),
  onEnter: () => trackPageView('/new'),
  head: () => ({ meta: [{ title: 'New chart — ChartGenie' }] }),
});
