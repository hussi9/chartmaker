import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/pie-chart-maker')({
  component: () => <Landing route="/pie-chart-maker" type="pie" steps={['Type or paste your category names and values.', 'Pick Pie or Donut and a look; the slices, labels and shares are drawn for you.', 'Export PNG or SVG at the post size you need, or copy a share link.']} />,
  onEnter: () => trackPageView('/pie-chart-maker'),
});
