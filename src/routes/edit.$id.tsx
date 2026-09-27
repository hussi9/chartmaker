import { createFileRoute } from '@tanstack/react-router';
import { Editor } from '../components/editor/Editor';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/edit/$id')({
  component: Editor,
  validateSearch: (s: Record<string, unknown>): { export?: 'set' } => (s.export === 'set' ? { export: 'set' } : {}),
  onEnter: () => trackPageView('/edit/$id'),
  head: () => ({ meta: [{ title: 'Editor — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});
