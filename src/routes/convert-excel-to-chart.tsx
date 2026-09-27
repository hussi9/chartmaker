import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '../components/seo/Landing';
import { trackPageView } from '../lib/gtag';

export const Route = createFileRoute('/convert-excel-to-chart')({
  component: () => <Landing route="/convert-excel-to-chart" type="horizontalBar" intakeFirst steps={['Copy a label column and a value column from Excel, Numbers or Sheets.', 'Paste them into ChartGenie; the rows and units are detected and three charts are suggested.', 'Pick one, adjust the look, and export or share.']} />,
  onEnter: () => trackPageView('/convert-excel-to-chart'),
});
