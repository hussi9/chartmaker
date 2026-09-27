// GET /s/:state/og.png → the chart rendered as a 1200px-wide PNG for link previews.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cardPng, specFromState } from './_lib/render';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const spec = specFromState(req.query.state);
  if (!spec) {
    res.status(404).setHeader('Cache-Control', 'public, max-age=300');
    res.send('No chart in this link.');
    return;
  }
  try {
    const png = cardPng(spec, 1200);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(png);
  } catch {
    res.status(500).send('Could not render this chart.');
  }
}
