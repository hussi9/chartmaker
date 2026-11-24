import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/chart-for-linkedin-post')({
  component: () => <Landing route="/chart-for-linkedin-post" type="bar" steps={['Paste two columns or type a sentence, and check the detected rows.', 'Choose the 1:1 LinkedIn size and fix anything the post-ready checks flag.', 'Export the PNG, then paste the alt text and caption into your post.']} />,
  onEnter: () => trackPageView('/chart-for-linkedin-post'),
});
