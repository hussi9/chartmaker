import { routeMetadata, type PublishedRoute } from './routeMetadata.ts';
import { GUIDE_CONTENT, type GuideSection } from './guideContent.ts';

// Shared by the visible app and initial HTML so crawler answers stay in sync.
export interface SearchContent { answer: string; questions: { question: string; answer: string }[]; sections?: GuideSection[]; cta?: { href: string; label: string } }
export const searchContent: Record<PublishedRoute, SearchContent> = {
  '/': {
    answer: 'ChartGenie is a free online chart maker for social posts and slides. Paste spreadsheet rows or enter your own numbers, check the data, choose a chart look, and download a PNG or SVG. Editing and saved charts stay in your browser; an account is optional.',
    questions: [
      { question: 'How do I make a chart from spreadsheet data?', answer: 'Copy a label column and a numeric column from Excel or Google Sheets, open Paste numbers, and paste the cells. Review the detected rows and units before choosing a chart. You can also import a CSV file.' },
      { question: 'Which chart should I use?', answer: 'Use bars to compare categories, a line to show change over time, and a pie or donut to show parts of one whole. Start with the message your reader needs to understand, then choose the chart that makes that comparison clear.' },
      { question: 'Do I need an account to export a chart?', answer: 'No. You can create and export PNG and SVG charts without signing in. Charts are saved in this browser, so export a JSON backup if you need to move or preserve your work.' },
    ],
  },
  '/pie-chart-maker': {
    answer: 'A pie chart shows how categories contribute to a whole. In ChartGenie, enter category names and positive values, check that they belong to the same total, then choose a pie or donut look. Export the result as PNG for a post or SVG for a scalable graphic.',
    questions: [
      { question: 'Do pie chart values have to add up to 100?', answer: 'No. You can enter counts or amounts; slice sizes represent each value as a share of the total. Use values with the same unit and categories that describe one whole. Review the total before publishing.' },
      { question: 'When should I use a bar graph instead of a pie chart?', answer: 'Use a bar graph when you need readers to compare similar values, show many categories, or include negative values. Pie charts are most useful when the main message is the composition of one total.' },
      { question: 'Can I edit the example and download it?', answer: 'Yes. Choose Start with this chart, replace the sample category names and values, and adjust the look. Export a PNG or SVG after checking the labels and post size.' },
    ],
  },
  '/bar-graph-maker': {
    answer: 'A bar graph compares values across categories using bar lengths. ChartGenie lets you replace the example rows or paste your own numbers, choose a bar or ranked-bar look, and export PNG or SVG for a presentation or social post.',
    questions: [
      { question: 'What data do I need for a bar graph?', answer: 'Start with category labels and a numeric value for each category. Keep the values in the same unit so bar lengths make a meaningful comparison. Review copied or imported rows before exporting.' },
      { question: 'When are horizontal bars useful?', answer: 'Horizontal bars give long category labels more room and work well for ranked comparisons. Vertical bars are useful for shorter labels. Choose the orientation that keeps names and values easy to read at the final export size.' },
      { question: 'Can I use a bar chart in slides or social posts?', answer: 'Yes. Choose a post size and export PNG for an image or SVG for a scalable graphic. ChartGenie includes 16:9, square, portrait Story, and 4:3 deck sizes.' },
    ],
  },
  '/convert-excel-to-chart': {
    answer: 'To turn Excel data into a chart with ChartGenie, copy cells from a worksheet and paste them into the app. Review the parsed labels, numbers, and units, select a suggested chart, and export PNG or SVG. This workflow copies cell values; it does not import an Excel workbook.',
    questions: [
      { question: 'Can I upload an XLSX workbook?', answer: 'Use copied spreadsheet cells or a CSV file. ChartGenie does not import XLSX workbooks, formulas, workbook formatting, or multiple sheets. Copy the relevant labels and values from the sheet you want to chart.' },
      { question: 'Does this work with Google Sheets or Apple Numbers?', answer: 'Yes. Copy the cells containing category labels and numeric values, then paste them into ChartGenie. Check the preview for headers, decimals, and units before creating the chart.' },
      { question: 'Will the chart update when my spreadsheet changes?', answer: 'No. Pasted cells are a snapshot, not a live spreadsheet connection. Paste or edit the new values when your data changes, then export the updated chart.' },
    ],
  },
  '/line-graph-maker': {
    answer: 'A line graph shows how a value changes over time. In ChartGenie, enter a date or period and a numeric value for each point, check the detected rows and units, then choose a line, area or stacked look. Export the chart as PNG for a post or SVG for a slide.',
    questions: [
      { question: 'When should I use a line graph?', answer: 'Use a line graph when the order of the points matters, such as sales by month, a weekly trend or a measurement over several years. Use bars instead when you are comparing unrelated categories.' },
      { question: 'Can I plot more than one series?', answer: 'Yes. Use stacked or multiple-series looks to compare related series, keep them in the same unit, and label each line so readers can tell them apart.' },
      { question: 'Does a line graph need an account?', answer: 'No. You can create and export PNG and SVG line charts without signing in. Charts are saved in this browser, so export a JSON backup if you need to keep or move your work.' },
    ],
  },
  ...GUIDE_CONTENT,
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function initialPageContent(path: PublishedRoute): string {
  const meta = routeMetadata[path];
  const content = searchContent[path];
  const related = (Object.keys(routeMetadata) as PublishedRoute[]).filter((route) => route !== path);
  return `<main class="cg-page cg-landing"><h1>${escapeHtml(meta.heading)}</h1><p>${escapeHtml(content.answer)}</p>${(content.sections ?? []).map(({ heading, paragraphs }) => `<h2>${escapeHtml(heading)}</h2>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}`).join('')}${content.cta ? `<p><a href="${content.cta.href}">${escapeHtml(content.cta.label)}</a></p>` : ''}<p><a href="/new">Paste your numbers and create a chart</a></p><section aria-label="Chart questions">${content.questions.map(({ question, answer }) => `<h2>${escapeHtml(question)}</h2><p>${escapeHtml(answer)}</p>`).join('')}</section><nav aria-label="Chart tools">${related.map((route) => `<p><a href="${route}">${escapeHtml(routeMetadata[route].heading)}</a></p>`).join('')}</nav><p><a href="/privacy.html">Privacy and data storage</a> · <a href="mailto:admin@aimasterz.com">Contact support</a></p><noscript><p>Enable JavaScript to use the chart editor. The guides above are available without JavaScript.</p></noscript></main>`;
}
