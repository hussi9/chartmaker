import { createFileRoute } from '@tanstack/react-router';
import { SharePage } from '../components/share/SharePage';
import { trackPageView } from '../lib/gtag';

// Long charts (and every v1 link) travel in the hash: /s#<state>.
export const Route = createFileRoute('/s/')({
  component: SharePage,
  onEnter: () => trackPageView('/s'),
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
});
