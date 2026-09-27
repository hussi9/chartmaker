// GET /s/:state/og.png — see server/og.ts; this entry only loads the bundle scripts/build-api.mjs produces.
import handler from './_lib/og.mjs';
export const config = { runtime: 'nodejs' };
export default handler;
