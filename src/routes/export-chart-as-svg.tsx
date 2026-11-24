import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/export-chart-as-svg')({
  component: () => <Landing route="/export-chart-as-svg" type="line" steps={['Build the chart from your numbers and pick the post size.', 'Open Export and choose SVG to download a vector file with fonts embedded.', 'Or export the set to get PNG and SVG for every size in one zip.']} />,
  onEnter: () => trackPageView('/export-chart-as-svg'),
});
