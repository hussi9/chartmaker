import { createFileRoute } from '@tanstack/react-router';
import { MyCharts } from '../components/charts/MyCharts';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/charts')({
  component: MyCharts,
  onEnter: () => trackPageView('/charts'),
  head: () => ({ meta: [{ title: 'My charts — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});
