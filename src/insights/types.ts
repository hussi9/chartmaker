export type InsightKind = 'largest' | 'smallest' | 'share' | 'ratio' | 'average' | 'delta' | 'trend' | 'sum100';

export interface Insight {
  id: string;
  kind: InsightKind;
  text: string;
  rowId?: string;
  value: number;
}
