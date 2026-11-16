// Embed snippet for a chart's share link. The snippet is an image of the chart
// card (GET /s/<state>/og.png, rendered on request from the link's own state)
// wrapped in a link back to the chart. Nothing is stored server-side, so an
// embed cannot be revoked centrally; the snippet says so in its comment.
// Only path-form share links can be embedded; long hash-form links cannot.

const escapeAttr = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function canEmbed(sharePath: string | undefined): sharePath is string {
  return typeof sharePath === 'string' && /\/s\/[A-Za-z0-9_-]+$/.test(sharePath);
}

export function embedSnippet(sharePath: string, alt: string): string {
  const href = escapeAttr(sharePath);
  const src = escapeAttr(`${sharePath}/og.png`);
  const label = escapeAttr(alt.trim() || 'Chart made with ChartGenie');
  return [
    `<!-- Chart from ChartGenie. The image is rendered from this link when it loads; nothing is stored on a server, so the embed cannot be revoked centrally. -->`,
    `<a href="${href}"><img src="${src}" alt="${label}" width="1200" style="max-width:100%;height:auto"></a>`,
  ].join('\n');
}
