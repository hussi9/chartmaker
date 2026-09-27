import { describe, it, expect } from 'vitest';
import { detect, detectCsvFile } from '@/insights/intake';

const SAMPLE = 'USA        87\nItaly      20\nUK         12\nIreland    15';

describe('detect()', () => {
  it('reads space-aligned cells', () => {
    const d = detect(SAMPLE);
    expect(d.kind).toBe('cells');
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['USA', 87], ['Italy', 20], ['UK', 12], ['Ireland', 15]]);
    expect(d.unit).toBeUndefined();
    expect(d.warnings).toEqual([]);
  });

  it('reads tab-separated spreadsheet cells with a header', () => {
    const d = detect('Country\tVisits\nUSA\t87\nItaly\t20');
    expect(d.kind).toBe('cells');
    expect(d.columns).toEqual(['Country', 'Visits']);
    expect(d.rows).toHaveLength(2);
    expect(d.rows[0]).toMatchObject({ label: 'USA', value: 87 });
  });

  it('reads comma-separated text as csv', () => {
    const d = detect('label,value\nMobile,62\nDesktop,30\nTablet,8');
    expect(d.kind).toBe('csv');
    expect(d.columns).toEqual(['label', 'value']);
    expect(d.rows.map((r) => r.value)).toEqual([62, 30, 8]);
  });

  it('parses a growth sentence into two dated rows with compact units', () => {
    const d = detect('Revenue grew from 12k in Jan to 34k in Jun');
    expect(d.kind).toBe('sentence');
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['Jan', 12000], ['Jun', 34000]]);
    expect(d.unit).toBe('compact');
    expect(d.title).toBe('Revenue');
  });

  it('parses an inline list sentence', () => {
    const d = detect('Tesla 1.8M, Ford 4.4M, GM 6.2M');
    expect(d.kind).toBe('sentence');
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['Tesla', 1_800_000], ['Ford', 4_400_000], ['GM', 6_200_000]]);
    expect(d.unit).toBe('compact');
  });

  it('keeps negatives and percent units', () => {
    const d = detect('Q1 -12%\nQ2 4%\nQ3 9%');
    expect(d.rows.map((r) => r.value)).toEqual([-12, 4, 9]);
    expect(d.unit).toBe('percent');
  });

  it('strips thousands separators and currency', () => {
    const d = detect('Rent $1,200\nFood $640\nTravel $310');
    expect(d.rows.map((r) => r.value)).toEqual([1200, 640, 310]);
    expect(d.unit).toBe('currency');
  });

  it('warns on mixed units and uses the majority', () => {
    const d = detect('A 10%\nB 20%\nC $30');
    expect(d.unit).toBe('percent');
    expect(d.warnings.some((w) => /mixed units/i.test(w))).toBe(true);
  });

  it('truncates past 500 rows with a warning', () => {
    const big = Array.from({ length: 620 }, (_, i) => `Row ${i}\t${i}`).join('\n');
    const d = detect(big);
    expect(d.rows).toHaveLength(500);
    expect(d.warnings.some((w) => /500/.test(w))).toBe(true);
  });

  it('returns empty for blank or number-free text', () => {
    expect(detect('').kind).toBe('empty');
    expect(detect('   \n ').kind).toBe('empty');
    expect(detect('hello there friend').kind).toBe('empty');
    expect(detect('hello there friend').rows).toEqual([]);
  });

  it('reads label: value pairs and "label - value" pairs', () => {
    expect(detect('Coffee: 4\nTea: 2').rows.map((r) => r.value)).toEqual([4, 2]);
    expect(detect('Coffee - 4\nTea - 2').rows.map((r) => r.label)).toEqual(['Coffee', 'Tea']);
  });

  it('gives every row a unique id', () => {
    const ids = detect(SAMPLE).rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('detectCsvFile()', () => {
  it('parses a CSV file with a header', async () => {
    const file = new File(['name,count\nA,1\nB,2\n'], 'data.csv', { type: 'text/csv' });
    const d = await detectCsvFile(file);
    expect(d.kind).toBe('csv');
    expect(d.columns).toEqual(['name', 'count']);
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['A', 1], ['B', 2]]);
  });
});
