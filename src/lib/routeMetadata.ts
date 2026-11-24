export const routeMetadata = {
  '/': {
    title: 'ChartGenie — Free Chart Maker for Social Posts and Slides',
    description: 'Turn your own numbers or pasted spreadsheet rows into a polished chart. Preview the data, choose a format, and export PNG or SVG in your browser.',
    heading: 'Make a chart from your own numbers'
  },
  '/pie-chart-maker': {
    title: 'Pie Chart Maker — ChartGenie',
    description: 'Create a pie chart from your own category values. Start with an illustrative example, edit the rows, and export PNG or SVG.',
    heading: 'Create a pie chart from category values'
  },
  '/bar-graph-maker': {
    title: 'Bar Graph Maker — ChartGenie',
    description: 'Compare categories with a bar graph. Edit the example rows or paste your own values, then export PNG or SVG.',
    heading: 'Compare values with a bar graph'
  },
  '/line-graph-maker': {
    title: 'Line Graph Maker — ChartGenie',
    description: 'Show change over time with a line graph. Edit the example points or paste your own dated values, then export PNG or SVG.',
    heading: 'Show change over time with a line graph'
  },
  '/convert-excel-to-chart': {
    title: 'Convert Excel Rows to a Chart — ChartGenie',
    description: 'Paste rows copied from Excel or a spreadsheet into ChartGenie, check the parsed values, then make a chart and export it.',
    heading: 'Turn spreadsheet rows into a chart'
  },
  '/chart-for-linkedin-post': {
    title: 'Make a Chart for a LinkedIn Post — ChartGenie',
    description: 'How to turn a few numbers into a LinkedIn-ready chart: the 1080 by 1080 square size, safe zones, readable labels, alt text and a PNG export.',
    heading: 'How to make a chart for a LinkedIn post'
  },
  '/export-chart-as-svg': {
    title: 'Export a Chart as SVG (Vector File) — ChartGenie',
    description: 'How to export a chart as a real SVG file with its fonts embedded, when SVG beats PNG, and how to open or edit the file in slides and design tools.',
    heading: 'How to export a chart as an SVG file'
  },
  '/chart-maker-no-signup': {
    title: 'Chart Maker With No Signup or Account — ChartGenie',
    description: 'Make and download a chart without an account: paste numbers, check the rows, export PNG or SVG, and how saving and backups work in your browser.',
    heading: 'Make a chart without signing up'
  }
} as const;

export type PublishedRoute = keyof typeof routeMetadata;

// The how-to guides, as distinct from the four chart-tool pages.
export const GUIDE_ROUTES = ['/chart-for-linkedin-post', '/export-chart-as-svg', '/chart-maker-no-signup'] as const satisfies readonly PublishedRoute[];

export function isPublishedRoute(pathname: string): pathname is PublishedRoute {
  return Object.hasOwn(routeMetadata, pathname);
}

// Client routes the SPA owns. Anything outside these and the published routes is a true 404.
export const APP_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/, /^\/new$/, /^\/charts$/, /^\/series$/, /^\/brand$/,
  /^\/edit\/[A-Za-z0-9_-]+$/, /^\/s(\/[A-Za-z0-9_-]+)?$/,
];

export function isAppPath(pathname: string): boolean {
  return isPublishedRoute(pathname) || APP_ROUTE_PATTERNS.some((re) => re.test(pathname));
}
