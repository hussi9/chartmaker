import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/bar-graph-maker')({
  component: () => <Landing route="/bar-graph-maker" type="bar" steps={['Enter the categories and the value for each.', 'Choose bars, ranked bars or a stacked view, then a look and a post size.', 'Export PNG or SVG, or share a link that shows the chart as a card.']} />,
  onEnter: () => trackPageView('/bar-graph-maker'),
});
