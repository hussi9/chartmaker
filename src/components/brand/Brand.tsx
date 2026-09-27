// Brand kit: palette, type pair, badge and logo, saved once in this browser.
import { useCallback, useEffect, useState } from 'react';
import { db, type BrandDoc } from '../../db';
import { useUi } from '../../store/ui';
import { useTopBar } from '../shell/TopBar';
import { PALETTES } from '../../chart/types';
import { simulate, safePalette, blobToDataUrl, type Deficiency } from '../../chart/cvd';
import { Toggle } from '../common/Toggle';
import { Seg } from '../common/Seg';
import { Button } from '../common/Button';
import { track } from '../../lib/gtag';
import './brand.css';

const DEFAULT_BRAND: BrandDoc = { id: 'brand', palette: [...PALETTES[0].colors], safe: false, corner: 'br', applyToNew: false };
const MAX_LOGO = 200 * 1024;
const KINDS: { id: Deficiency; label: string }[] = [{ id: 'deuteranopia', label: 'Deuteranopia' }, { id: 'protanopia', label: 'Protanopia' }, { id: 'tritanopia', label: 'Tritanopia' }];
const CORNERS: { value: BrandDoc['corner']; label: string }[] = [{ value: 'tl', label: 'Top left' }, { value: 'tr', label: 'Top right' }, { value: 'bl', label: 'Bottom left' }, { value: 'br', label: 'Bottom right' }];

function isHex(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(s);
}

export function Brand(): React.JSX.Element {
  const storage = useUi((s) => s.storage);
  const toast = useUi((s) => s.toast);
  const [brand, setBrand] = useState<BrandDoc>(DEFAULT_BRAND);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (storage !== 'ok') return;
    void db.brand.get('brand').then((b) => { if (b) setBrand(b); });
  }, [storage]);

  useEffect(() => {
    if (!brand.logo) { setLogoUrl(null); return; }
    const url = URL.createObjectURL(brand.logo);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [brand.logo]);

  useEffect(() => {
    useTopBar.getState().set({ crumb: 'Brand' });
    return () => useTopBar.getState().set({ crumb: undefined });
  }, []);

  const save = useCallback(async (next: BrandDoc) => {
    setBrand(next);
    if (storage !== 'ok') return;
    await db.brand.put(next);
    if (next.handle !== undefined) {
      const s = (await db.settings.get('settings')) ?? { id: 'settings' as const };
      await db.settings.put({ ...s, handle: next.handle || undefined });
      useUi.setState({ handle: next.handle || undefined });
    }
    useUi.setState({ brand: { ...next, logoDataUrl: next.logo ? await blobToDataUrl(next.logo).catch(() => undefined) : undefined } });
    track('brand_apply', {});
  }, [storage]);

  const setColour = (i: number, raw: string) => {
    setDrafts((d) => ({ ...d, [i]: raw }));
    if (isHex(raw)) void save({ ...brand, palette: brand.palette.map((c, j) => (j === i ? raw.toLowerCase() : c)) });
  };
  const addColour = () => { if (brand.palette.length < 8) void save({ ...brand, palette: [...brand.palette, '#1e293b'] }); };
  const removeColour = (i: number) => { if (brand.palette.length > 1) void save({ ...brand, palette: brand.palette.filter((_, j) => j !== i) }); };

  const onLogo = async (file: File) => {
    setLogoError(null);
    if (file.size > MAX_LOGO) { setLogoError(`Logo must be under 200 KB (this one is ${Math.round(file.size / 1024)} KB).`); return; }
    if (!/^image\/(png|svg\+xml|jpeg|webp)$/.test(file.type)) { setLogoError('Use a PNG, SVG, JPEG or WebP.'); return; }
    await save({ ...brand, logo: file });
    toast('Logo saved');
  };

  const shown = brand.safe ? safePalette(brand.palette) : brand.palette;

  return (
    <div className="cg-page cg-brand">
      <h1 className="cg-h1" style={{ fontSize: 30 }}>My brand</h1>
      <div className="cg-card cg-brand-card">
        <div className="cg-cell">
          <span className="cg-lbl">Palette</span>
          <div className="cg-brand-swatches">
            {brand.palette.map((c, i) => (
              <div key={i} className="cg-brand-swatch">
                <input type="color" className="cg-brand-picker" aria-label={`Pick colour ${i + 1}`} value={c} onChange={(e) => setColour(i, e.target.value)} />
                <input className="cg-input cg-brand-hex cg-mono" aria-label={`Colour ${i + 1}`} value={drafts[i] ?? c} onChange={(e) => setColour(i, e.target.value)} onBlur={() => setDrafts((d) => { const { [i]: _x, ...rest } = d; void _x; return rest; })} maxLength={7} />
                <button type="button" className="cg-brand-remove" aria-label={`Remove colour ${i + 1}`} disabled={brand.palette.length <= 1} onClick={() => removeColour(i)}>×</button>
              </div>
            ))}
            {brand.palette.length < 8 && <Button size="sm" variant="ghost" onClick={addColour} aria-label="Add colour">+ colour</Button>}
          </div>
          <div className="cg-brand-cvd" role="group" aria-label="Colour-blind preview">
            {KINDS.map((k) => (
              <div key={k.id} className="cg-brand-cvd-row">
                <span className="cg-hint cg-brand-cvd-label">{k.label}</span>
                <div className="cg-brand-cvd-swatches">{brand.palette.map((c, i) => <span key={i} role="img" aria-label={`${k.label} view of colour ${i + 1}`} style={{ background: simulate(c, k.id) }} />)}</div>
              </div>
            ))}
          </div>
          <Toggle label="Use a colour-blind-safe palette (Okabe–Ito, matched to your hues)" checked={brand.safe} onChange={(v) => save({ ...brand, safe: v })} />
          {brand.safe && (
            <div className="cg-brand-cvd-row" role="group" aria-label="Safe palette">
              <span className="cg-hint cg-brand-cvd-label">Safe palette</span>
              <div className="cg-brand-cvd-swatches">{shown.map((c, i) => <span key={i} role="img" aria-label={`Safe colour ${i + 1}`} data-color={c} style={{ background: c }} />)}</div>
            </div>
          )}
        </div>
        <div className="cg-cell">
          <span className="cg-lbl">Type</span>
          <div className="cg-brand-type"><span className="cg-brand-type-display">Bricolage Grotesque</span><span className="cg-hint">headline</span></div>
          <div className="cg-brand-type"><span>Geist</span><span className="cg-hint">labels</span></div>
          <span className="cg-hint">The type pair is fixed in this version; every export uses these two.</span>
        </div>
        <div className="cg-cell">
          <span className="cg-lbl">Badge</span>
          <input className="cg-input" aria-label="Handle" placeholder="@yourhandle" value={brand.handle ? `@${brand.handle}` : ''} onChange={(e) => save({ ...brand, handle: e.target.value.replace(/^@/, '').replace(/\s+/g, '').slice(0, 40) })} />
          <div className="cg-brand-logo-row">
            {logoUrl ? <img className="cg-brand-logo" src={logoUrl} alt="Your logo" /> : <span className="cg-hint">No logo yet</span>}
            <label className="cg-btn cg-btn-sm cg-brand-logo-btn">
              {logoUrl ? 'Replace logo' : '+ logo'}
              <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" hidden aria-label="Logo file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onLogo(f); e.target.value = ''; }} />
            </label>
            {logoUrl && <Button size="sm" variant="ghost" onClick={() => save({ ...brand, logo: undefined })} aria-label="Remove logo">Remove</Button>}
          </div>
          {logoError && <span className="cg-hint cg-warn" role="alert">{logoError}</span>}
          <Seg<BrandDoc['corner']> label="Badge corner" size="sm" value={brand.corner} options={CORNERS} onChange={(corner) => save({ ...brand, corner })} />
        </div>
        <div className="cg-cell cg-brand-last">
          <Toggle label="Apply to every new chart" checked={brand.applyToNew} onChange={(v) => save({ ...brand, applyToNew: v })} />
        </div>
      </div>
      <p className="cg-hint">Saved in this browser.</p>
    </div>
  );
}
