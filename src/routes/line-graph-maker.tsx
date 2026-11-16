import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/line-graph-maker')({
  component: () => <Landing route="/line-graph-maker" type="line" steps={['Enter a date or period and the value for each point.', 'Choose a line, area or stacked look, then a post size.', 'Export PNG or SVG, or share a link that shows the chart as a card.']} />,
  onEnter: () => trackPageView('/line-graph-maker'),
});
