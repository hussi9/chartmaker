// Runs once per session: open storage, pull the v1 library in, load the handle and brand.
// Storage that opens and then fails (quota, private mode) must not take the app down:
// the person can still edit and export, and the top bar says "Not saved in this browser".
import { openDb, db } from '../db';
import { migrateFromLocalStorage } from '../db/migrate';
import { notifyDue } from '../db/series';
import { blobToDataUrl } from '../chart/cvd';
import { useUi } from '../store/ui';

let booted: Promise<void> | null = null;

export function boot(): Promise<void> {
  if (!booted) {
    booted = (async () => {
      const storage = await openDb();
      useUi.setState({ storage });
      if (storage !== 'ok') return;
      try {
        await migrateFromLocalStorage();
        const settings = await db.settings.get('settings');
        if (settings?.handle) useUi.setState({ handle: settings.handle });
        void notifyDue();
        const brand = await db.brand.get('brand');
        if (brand) useUi.setState({ brand: { ...brand, logoDataUrl: brand.logo ? await blobToDataUrl(brand.logo).catch(() => undefined) : undefined } });
      } catch {
        useUi.setState({ storage: 'unavailable' });
        booted = null; // try again on the next navigation
      }
    })();
  }
  return booted;
}

export function resetBootForTests(): void {
  booted = null;
}
