import { createFileRoute } from '@tanstack/react-router';
import { Brand } from '../components/brand/Brand';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/brand')({
  component: Brand,
  onEnter: () => trackPageView('/brand'),
  head: () => ({ meta: [{ title: 'Brand — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});
