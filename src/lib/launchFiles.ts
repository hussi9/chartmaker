// Handles a file the OS launched ChartGenie with (file_handlers in the
// manifest — "Open with ChartGenie" on a .csv or a photo). An image goes
// through the exact same shareInbox handoff as a real OS share (see
// src/sw.ts's handleShareTarget and Intake.tsx's hydration effect) so it
// never gets read as text; only non-image files use the pre-existing
// paste-box prefill.
import { db, openDb } from '../db';

export async function handleLaunchFile(file: File): Promise<{ search: { shared: true } | { text: string } }> {
  if (file.type.startsWith('image/')) {
    await openDb();
    await db.shareInbox.put({ id: 'pending', blob: file, at: Date.now() });
    return { search: { shared: true } };
  }
  const text = (await file.text()).slice(0, 20_000);
  return { search: { text } };
}
