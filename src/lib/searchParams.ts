// TanStack Router's default query-string parser coerces numeric- and boolean-
// looking values ("1", "12345", "true", "false") to actual JS numbers/booleans,
// not strings — so `typeof s.x === 'string'` silently drops a real value whose
// text happens to look like a number or the word true/false (a shared caption
// of just "2024", or "true"). These helpers normalize whatever comes back.

/** A string param that survives numeric/boolean coercion. Empty/missing → undefined. */
export function stringParam(s: Record<string, unknown>, key: string, maxLen: number): string | undefined {
  const v = s[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object') return undefined; // arrays/objects are never a valid value here
  const str = String(v);
  return str === '' ? undefined : str.slice(0, maxLen);
}

/** A boolean flag param ("1", 1, "true", true all mean on). */
export function boolParam(s: Record<string, unknown>, key: string): boolean {
  const v = s[key];
  return v === true || v === 1 || v === '1' || v === 'true';
}
