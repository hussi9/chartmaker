// A picture is just another way to produce text lines for the existing
// detect() pipeline — this module owns nothing about row parsing itself.
import { recognizeImage } from '../ocr/engine';
import { detect } from './intake';
import type { Detection } from './intake';

const NO_TEXT_FOUND = "Couldn't find a clear table in that picture. Try a straighter, better-lit shot, or paste the numbers instead.";
const READ_FAILED = "Couldn't read that picture — try again.";

export async function detectImage(file: File): Promise<Detection> {
  let lines: string[];
  try {
    lines = await recognizeImage(file);
  } catch {
    return { kind: 'image', rows: [], warnings: [READ_FAILED] };
  }
  const text = lines.join('\n');
  if (!text.trim()) return { kind: 'image', rows: [], warnings: [NO_TEXT_FOUND] };
  const d = detect(text);
  if (d.rows.length === 0) return { ...d, kind: 'image', warnings: [NO_TEXT_FOUND, ...d.warnings] };
  return { ...d, kind: 'image' };
}
