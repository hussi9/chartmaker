import { useEffect, useRef, useState } from 'react';
import { measurementAllowed, measurementReady, privacySignal, setMeasurementConsent, VERCEL_WEB_READY, vercelWebAllowed } from '../lib/gtag';
import { installMonitoring } from '../lib/browser-monitoring';

export function MeasurementConsent() {
  const [allowed, setAllowed] = useState(() => measurementAllowed() || vercelWebAllowed());
  const vercelController = useRef<ReturnType<typeof installMonitoring> | null>(null);
  useEffect(() => {
    const update = () => {
      setAllowed(measurementAllowed() || vercelWebAllowed());
      if (vercelWebAllowed()) {
        if (!vercelController.current) vercelController.current = installMonitoring({ window, document, allowed: vercelWebAllowed, route: (path: string) => path === window.location.pathname && !window.location.search && !window.location.hash ? path : null, speedRoute: () => null });
        else vercelController.current.refresh();
      }
      // Keep the installed hook: it checks current consent on every send.
      // Destroying it here prevents the existing provider from resuming later.
    };
    window.addEventListener('measurement-consent-change', update);
    update();
    return () => window.removeEventListener('measurement-consent-change', update);
  }, []);
  const ready = measurementReady() || VERCEL_WEB_READY;
  const blocked = privacySignal();
  return <section aria-label="Privacy choices" style={{ padding: '12px 24px', fontSize: 13 }}>
    <p>{!ready ? 'Optional measurement is not collecting while provider verification is pending.' : blocked ? 'Optional measurement is off because your browser requests privacy.' : allowed ? 'Optional usage measurement is on.' : 'Optional usage measurement is off (cookieless visit counts only).'} Guest tools work without it.</p>
    {ready && !blocked && <button type="button" onClick={() => setMeasurementConsent(!allowed)}>{allowed ? 'Turn off measurement' : 'Allow optional measurement'}</button>}
    <p>On public pages we count visits with cookieless Google Analytics pings: consent starts denied, so no cookies are set and no ad features run. Allowing upgrades consent (analytics cookies plus bounded product events); turning it off stops every send. Withdrawal stops new sends; it does not delete data already sent. <a href="/privacy.html">Privacy details</a></p>
  </section>;
}