import { createFileRoute } from '@tanstack/react-router';
import { SharePage } from '../components/share/SharePage';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/s/$state')({
  component: SharePage,
  onEnter: () => trackPageView('/s/$state'),
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
});
