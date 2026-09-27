// GET /s/:state — see server/share.ts; this entry only loads the bundle scripts/build-api.mjs produces.
import handler from './_lib/share.mjs';
export const config = { runtime: 'nodejs' };
export default handler;
