import { createFileRoute } from '@tanstack/react-router';
import { Templates } from '../components/gallery/Templates';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/')({
  component: Templates,
  onEnter: () => trackPageView('/'),
});
