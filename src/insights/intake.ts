// "Paste anything": spreadsheet cells, a CSV, or a sentence become rows.
// Deterministic rules; the person confirms the rows before charting.
import Papa from 'papaparse';
import type { Row, Unit } from '../chart/types';

export type IntakeKind = 'cells' | 'sentence' | 'csv' | 'image' | 'empty';

export interface Detection {
  kind: IntakeKind;
  rows: Row[];
  unit?: Unit;
  columns?: string[];
  title?: string;
  warnings: string[];
}

export const MAX_INTAKE_ROWS = 500;

const VALUE = String.raw`[$€£¥]?\s*[+-]?\d[\d,]*(?:\.\d+)?\s*(?:[kKmMbB]|%)?`;
const VALUE_RE = new RegExp(`^(${VALUE})$`);
// ':' '=' '|' delimit anywhere; a dash only when spaced ("A - 4"), so "Q1 -12%" keeps its sign.
const NAMED = new RegExp(`^(.+?)\\s*(?:[:=|]|\\s[-–—]\\s)\\s*(${VALUE})$`);
const TRAILING = new RegExp(`^(.+?)\\s+(${VALUE})$`);
const LEADING = new RegExp(`^(${VALUE})\\s*[:=\\-–—|]?\\s+(.+)$`);
const MONTHS = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s+\d{2,4})?|q[1-4](?:\s+\d{4})?|\d{4}|(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*|(?:h[12])(?:\s+\d{4})?`;
const FROM_TO = new RegExp(String.raw`^(.*?)\b(?:went|grew|rose|climbed|increased|fell|dropped|declined|decreased|moved|changed)\s+from\s+(${VALUE})\s+(?:in|at|on|during)?\s*(${MONTHS})\s+to\s+(${VALUE})\s+(?:in|at|on|during)?\s*(${MONTHS})`, 'i');

export interface ParsedValue { value: number; unit?: Unit }

export function parseValue(raw: string): ParsedValue | null {
  const s = raw.trim();
  const m = /^([$€£¥])?\s*([+-]?)(\d[\d,]*(?:\.\d+)?)\s*([kKmMbB]|%)?$/.exec(s);
  if (!m) return null;
  const [, cur, sign, num, suffix] = m;
  let value = Number(num.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  if (sign === '-') value = -value;
  let unit: Unit | undefined;
  if (cur) unit = 'currency';
  if (suffix === '%') unit = 'percent';
  else if (suffix) {
    const mult = { k: 1e3, m: 1e6, b: 1e9 }[suffix.toLowerCase() as 'k' | 'm' | 'b'];
    value *= mult;
    unit = unit ?? 'compact';
  }
  return { value, unit };
}

function rowId(i: number): string {
  return `r${i + 1}`;
}

function finish(kind: IntakeKind, rows: { label: string; value: number; unit?: Unit }[], columns?: string[], title?: string): Detection {
  const warnings: string[] = [];
  let list = rows;
  if (list.length > MAX_INTAKE_ROWS) {
    warnings.push(`Only the first ${MAX_INTAKE_ROWS} rows were kept (${list.length} pasted).`);
    list = list.slice(0, MAX_INTAKE_ROWS);
  }
  const counts = new Map<Unit, number>();
  for (const r of list) if (r.unit) counts.set(r.unit, (counts.get(r.unit) ?? 0) + 1);
  let unit: Unit | undefined;
  let best = 0;
  for (const [u, c] of counts) if (c > best) { best = c; unit = u; }
  if (counts.size > 1) warnings.push(`Mixed units; using ${unit}.`);
  const out: Row[] = list.map((r, i) => ({ id: rowId(i), label: r.label.trim(), value: r.value, ...(unit ? { unit } : {}) }));
  return { kind, rows: out, unit, columns, title, warnings };
}

function isNumberish(s: string): boolean {
  return VALUE_RE.test(s.trim());
}

function fromTable(lines: string[][], kind: 'cells' | 'csv'): Detection | null {
  const cleaned = lines.map((cells) => cells.map((c) => c.trim())).filter((cells) => cells.some(Boolean));
  if (cleaned.length === 0) return null;
  const wide = cleaned.filter((c) => c.length >= 2);
  if (wide.length === 0) return null;
  let columns: string[] | undefined;
  let body = wide;
  const first = wide[0];
  if (!first.slice(1).some(isNumberish) && wide.length > 1) {
    columns = first;
    body = wide.slice(1);
  }
  // value column = first column (after the label) where most cells are numbers
  const width = Math.max(...body.map((c) => c.length));
  let valueCol = -1;
  for (let col = 1; col < width; col++) {
    const nums = body.filter((c) => c[col] !== undefined && isNumberish(c[col])).length;
    if (nums >= Math.ceil(body.length / 2)) { valueCol = col; break; }
  }
  if (valueCol === -1) return null;
  const rows = body
    .map((c) => ({ label: c[0], parsed: parseValue(c[valueCol] ?? '') }))
    .filter((r): r is { label: string; parsed: ParsedValue } => r.parsed !== null && r.label.length > 0)
    .map((r) => ({ label: r.label, value: r.parsed.value, unit: r.parsed.unit }));
  if (rows.length === 0) return null;
  return finish(kind, rows, columns);
}

function fromLines(lines: string[]): Detection | null {
  const rows: { label: string; value: number; unit?: Unit }[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^[-•*]\s+/, '').trim();
    if (!line) continue;
    const m = NAMED.exec(line) ?? TRAILING.exec(line);
    if (m) {
      const p = parseValue(m[2]);
      if (p) { rows.push({ label: m[1], value: p.value, unit: p.unit }); continue; }
    }
    const l = LEADING.exec(line);
    if (l) {
      const p = parseValue(l[1]);
      if (p) rows.push({ label: l[2], value: p.value, unit: p.unit });
    }
  }
  return rows.length ? finish('cells', rows) : null;
}

function fromSentence(text: string): Detection | null {
  const one = text.replace(/\s+/g, ' ').trim();
  const ft = FROM_TO.exec(one);
  if (ft) {
    const a = parseValue(ft[2]);
    const b = parseValue(ft[4]);
    if (a && b) {
      const title = ft[1].replace(/^(the|our|my)\s+/i, '').trim();
      return finish('sentence', [{ label: cap(ft[3]), value: a.value, unit: a.unit }, { label: cap(ft[5]), value: b.value, unit: b.unit }], undefined, title ? cap(title) : undefined);
    }
  }
  const parts = one.split(/\s*[,;]\s*|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const rows: { label: string; value: number; unit?: Unit }[] = [];
    for (const part of parts) {
      const lf = NAMED.exec(part) ?? TRAILING.exec(part);
      const m = lf ?? LEADING.exec(part);
      if (!m) continue;
      const valueStr = lf ? m[2] : m[1];
      const label = lf ? m[1] : m[2];
      const p = parseValue(valueStr);
      if (p) rows.push({ label, value: p.value, unit: p.unit });
    }
    if (rows.length >= 2) return finish('sentence', rows);
  }
  return null;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function detect(text: string): Detection {
  const t = (text ?? '').replace(/\r\n?/g, '\n').trim();
  if (!t) return { kind: 'empty', rows: [], warnings: [] };
  const lines = t.split('\n').filter((l) => l.trim());

  if (lines.some((l) => l.includes('\t'))) {
    const r = fromTable(lines.map((l) => l.split('\t')), 'cells');
    if (r) return r;
  }
  // "3,400" is a number, not two cells: judge CSV-ness with thousands separators removed.
  const noThousands = lines.map((l) => l.replace(/(\d),(?=\d{3}(?!\d))/g, '$1'));
  const commaRows = noThousands.filter((l) => l.includes(','));
  if (lines.length >= 2 && commaRows.length >= lines.length - 1) {
    const parsed = Papa.parse<string[]>(t, { skipEmptyLines: true });
    const r = fromTable(parsed.data, 'csv');
    if (r) return r;
  }
  if (lines.length >= 2) {
    const spaced = fromTable(lines.map((l) => l.trim().split(/\s{2,}/)), 'cells');
    if (spaced && spaced.rows.length >= Math.ceil(lines.length / 2)) return spaced;
    const r = fromLines(lines);
    if (r) return r;
  }
  const s = fromSentence(t);
  if (s) return s;
  if (lines.length === 1) {
    const r = fromLines(lines);
    if (r) return r;
  }
  return { kind: 'empty', rows: [], warnings: [] };
}

export function detectCsvFile(file: File | Blob): Promise<Detection> {
  return new Promise((resolve) => {
    Papa.parse<string[]>(file as File, {
      skipEmptyLines: true,
      complete: (res) => resolve(fromTable(res.data, 'csv') ?? { kind: 'empty', rows: [], warnings: ['No label and value columns were found in that file.'] }),
      error: () => resolve({ kind: 'empty', rows: [], warnings: ['That file could not be read.'] }),
    });
  });
}
