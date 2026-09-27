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
  '/convert-excel-to-chart': {
    title: 'Convert Excel Rows to a Chart — ChartGenie',
    description: 'Paste rows copied from Excel or a spreadsheet into ChartGenie, check the parsed values, then make a chart and export it.',
    heading: 'Turn spreadsheet rows into a chart'
  }
} as const;

export type PublishedRoute = keyof typeof routeMetadata;

export function isPublishedRoute(pathname: string): pathname is PublishedRoute {
  return Object.hasOwn(routeMetadata, pathname);
}
