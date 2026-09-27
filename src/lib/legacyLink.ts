// v1 share links were `${origin}/#state=<base64>` (and any path with that hash).
// The share route owns hash state, so anything else carrying `state=` goes there.
export interface LegacyRedirect { to: '/s'; hash: string }

export function legacyHashRedirect(loc: { pathname: string; hash: string }): LegacyRedirect | null {
  const hash = loc.hash.startsWith('#') ? loc.hash.slice(1) : loc.hash;
  if (!hash.includes('state=')) return null;
  if (loc.pathname === '/s' || loc.pathname === '/s/') return null;
  return { to: '/s', hash };
}
