import { createFileRoute } from '@tanstack/react-router';
import { Series } from '../components/series/Series';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/series')({
  component: Series,
  onEnter: () => trackPageView('/series'),
  head: () => ({ meta: [{ title: 'Series — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});
