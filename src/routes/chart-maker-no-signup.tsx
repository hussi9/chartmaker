import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/chart-maker-no-signup')({
  component: () => <Landing route="/chart-maker-no-signup" type="horizontalBar" intakeFirst steps={['Paste cells, type a sentence or drop a CSV file; no account needed.', 'Check the detected rows and units, then pick a suggested look.', 'Download PNG or SVG; your chart autosaves in this browser.']} />,
  onEnter: () => trackPageView('/chart-maker-no-signup'),
});
