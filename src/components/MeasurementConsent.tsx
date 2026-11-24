import { useEffect, useRef, useState } from 'react';
import { currentMeasurementRoute, measurementAllowed, measurementReady, privacySignal, setMeasurementConsent, VERCEL_WEB_READY, vercelWebAllowed } from '../lib/gtag';
import { installMonitoring } from '../lib/browser-monitoring';

export function MeasurementConsent() {
  const [allowed, setAllowed] = useState(() => measurementAllowed() || vercelWebAllowed());
  const vercelController = useRef<ReturnType<typeof installMonitoring> | null>(null);
  useEffect(() => {
    const update = () => {
      setAllowed(measurementAllowed() || vercelWebAllowed());
      if (vercelWebAllowed()) {
        if (!vercelController.current) vercelController.current = installMonitoring({ window, document, allowed: vercelWebAllowed, route: (path: string) => path === window.location.pathname ? currentMeasurementRoute() : null, speedRoute: () => null });
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
    <p>{!ready ? 'Measurement is not collecting while provider verification is pending.' : blocked ? 'Measurement is off because your browser requests privacy.' : allowed ? 'Usage measurement is on: aggregate page and tool events only, no ads, no profiling.' : 'Usage measurement is off for this browser: no analytics cookies are set and no data is sent.'} Guest tools work without it.</p>
    {ready && !blocked && <button type="button" onClick={() => setMeasurementConsent(!allowed)}>{allowed ? 'Turn measurement off' : 'Turn measurement on'}</button>}
    <p>Analytics is on by default so an ordinary visit is counted. There is no ad tracking and no data selling — only aggregate page and tool events. Turning measurement off stops every send from this browser. Withdrawal stops new sends; it does not delete data already sent. <a href="/privacy.html">Privacy details</a></p>
  </section>;
}