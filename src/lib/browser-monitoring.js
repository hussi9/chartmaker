/** Consent-gated, page-only Vercel monitoring. No application content or custom events. */
export function installMonitoring({window: win, document: doc, allowed, route, speedRoute = () => null,
  analyticsScript = '/_vercel/insights/script.js', speedScript = '/_vercel/speed-insights/script.js'}) {
  let destroyed = false;
  let loaded = false;
  const initialHref = win.location.href;
  let navigated = false;
  const validScripts = analyticsScript === '/_vercel/insights/script.js' && speedScript === '/_vercel/speed-insights/script.js';
  const sensitive = /(?:^|\/)(?:admin|account|auth|login|signup|reset|callback|pad|s|share|shared|phone)(?:\/|$)/i;
  function canonical(input, mapper = route) {
    try {
      const url = new URL(input, win.location.origin);
      if (url.origin !== win.location.origin || url.username || url.password || sensitive.test(decodeURIComponent(url.pathname))) return null;
      const path = mapper(url.pathname);
      if (typeof path !== 'string' || path.length > 256 || !/^\/(?!\/)[a-zA-Z0-9/_.:$-]*$/.test(path) || path.includes('..') || sensitive.test(path)) return null;
      return path;
    } catch { return null; }
  }
  function safeReferrer() {
    if (!doc.referrer) return true;
    try {
      const ref = new URL(doc.referrer);
      if (ref.search || ref.hash || ref.username || ref.password) return false;
      // The provider hook cannot edit referrers. Refuse unsafe ones entirely.
      return ref.origin === win.location.origin ? canonical(ref.href) === ref.pathname : ref.pathname === '/';
    } catch { return false; }
  }
  function active() {
    try {
      return !destroyed && validScripts && allowed() === true && ![win.navigator?.doNotTrack, win.doNotTrack, win.navigator?.msDoNotTrack].some(value => value === '1' || value === 'yes') && !win.navigator?.globalPrivacyControl && canonical(win.location.href) !== null && safeReferrer();
    } catch { return false; }
  }
  function beforeSend(type) {
    return event => {
      if (win.location.href !== initialHref) navigated = true;
      if (!active() || event?.type !== type || typeof event.url !== 'string') return null;
      const path = canonical(event.url, type === 'vital' ? speedRoute : route);
      if (path === null) return null;
      if (type === 'vital' && (navigated || canonical(initialHref, speedRoute) !== path)) return null;
      return type === 'vital' ? {type, url: win.location.origin + path, route:path} : {type, url:win.location.origin + path};
    };
  }
  function refresh() {
    if (win.location.href !== initialHref) navigated = true;
    if (!active() || loaded) return;
    // Do not coexist with an ungated provider installation.
    if (win.va || win.si || doc.querySelector('script[src*="/_vercel/insights/"],script[src*="/_vercel/speed-insights/"]')) return;
    loaded = true;
    for (const [name, src, type] of [['va',analyticsScript,'pageview'],['si',speedScript,'vital']]) {
      const staticSpeedPath = canonical(initialHref, speedRoute);
      if (type === 'vital' && (navigated || staticSpeedPath === null || staticSpeedPath !== new URL(initialHref).pathname)) continue;
      win[name] = function(...args) { (win[name + 'q'] = win[name + 'q'] || []).push(args); };
      win[name]('beforeSend', beforeSend(type));
      const script = doc.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset.debug = 'false';
      if (type === 'vital') script.dataset.route = staticSpeedPath;
      script.referrerPolicy = 'no-referrer';
      doc.head.appendChild(script);
    }
  }
  refresh();
  return {refresh, destroy() { destroyed = true; }};
}

