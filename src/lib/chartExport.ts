export const includeInChartExport = (node: Node): boolean =>
  !(node instanceof Element && node.hasAttribute('data-chart-export-exclude'));
