import type { DataItem, ChartType } from './chartPresets';

export interface ParsedAiResult {
  title: string;
  subtitle: string;
  data: DataItem[];
  recommendedType: ChartType;
}

const valuePattern = '[$€£¥]?\\s*[+-]?[\\d,.]+\\s*[kKmMbBtT%]?';
const namedValue = new RegExp(`^(.+?)\\s+(${valuePattern})$`);
const delimitedValue = new RegExp(`^([^:\\-=\\t,]+)[:\\-=\\t,]\\s*(${valuePattern})$`);
const leadingValue = new RegExp(`^(${valuePattern})\\s*[:\\-=\\t,]?\\s+(.+)$`);

function parseValue(raw: string): number | null {
  const match = raw.trim().replace(/[$€£¥,]/g, '').match(/^([+-]?\d+(?:\.\d+)?)\s*([kKmMbBtT%])?$/);
  if (!match) return null;
  const multiplier = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[match[2]?.toLowerCase() as 'k' | 'm' | 'b' | 't'] || 1;
  const value = Number(match[1]) * multiplier;
  return Number.isFinite(value) ? value : null;
}

export function parseNaturalLanguagePrompt(prompt: string): ParsedAiResult {
  const text = prompt.trim();
  const segments = text.split(/[\n;]+|(?<=\d[%kKmMbBtT]?)[,\s]+(?=[A-Za-z])/).map(part => part.trim()).filter(Boolean);
  const colon = segments[0]?.indexOf(':') ?? -1;
  const firstRemainder = colon >= 0 ? segments[0].slice(colon + 1).trim() : '';
  const hasHeading = colon > 0 && colon < 40 && namedValue.test(firstRemainder);
  const title = hasHeading ? segments[0].slice(0, colon).trim() : 'Custom Data Breakdown';
  if (hasHeading) segments[0] = firstRemainder;

  const rows: Array<{ name: string; value: number }> = [];
  for (const segment of segments) {
    const line = segment.replace(/^[-•*]\s*/, '');
    const pair = line.match(delimitedValue) || line.match(namedValue);
    const reversed = pair ? null : line.match(leadingValue);
    const name = (pair ? pair[1] : reversed?.[2])?.trim();
    const rawValue = pair ? pair[2] : reversed?.[1];
    const value = rawValue ? parseValue(rawValue) : null;
    if (name && name.length < 50 && value !== null) rows.push({ name, value });
  }

  const data: DataItem[] = rows.map((row, index) => ({ id: `${Date.now()}-${index}`, ...row }));
  const names = data.map(row => row.name.toLowerCase());
  const isTimeSeries = names.some(name => /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|20\d\d|mon|tue|wed|thu|fri|sat|sun|week\s*\d|day\s*\d)/.test(name));
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const recommendedType: ChartType = isTimeSeries ? 'line' : total >= 95 && total <= 105 ? 'donut' : data.length > 6 ? 'horizontalBar' : 'bar';

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    subtitle: data.length ? `Parsed ${data.length} rows — review values before export` : 'No label-value pairs found. Enter at least two rows with values.',
    data,
    recommendedType
  };
}
