import { createFileRoute } from '@tanstack/react-router';
import { Editor } from '../components/editor/Editor';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/edit/$id')({
  component: Editor,
  onEnter: () => trackPageView('/edit/$id'),
  head: () => ({ meta: [{ title: 'Editor — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});
