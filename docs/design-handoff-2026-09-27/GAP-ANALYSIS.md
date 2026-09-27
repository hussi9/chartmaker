# ChartGenie redesign — gap analysis (2026-09-27)

Source of truth for this analysis:

- Base design: `project/ChartGenie Redesign.dc.html` (3 screens: Templates, Editor, My charts)
- Reimagined: `project/ChartGenie Redesign v2.dc.html` (feature map + 5 screens: Intake, Editor v2, Share page, Series & Brand, Mobile quick post)
- Reference screenshot: `project/uploads/pasted-1790486151157-0.png` (the current live editor, 3D funnel)
- Current product: working tree of `~/devpro/chartmaker` (uncommitted audit fixes, 89/89 tests passing) and https://chartgenie.xyz (deployed 3h before this review, matches the tree)
- Own docs: `docs/CHARTGENIE-PM-CMO-REVIEW-2026-09-26.md`, `docs/uiux-audit-2026-09-26/*`, `docs/EXPORT-STABILITY.md`, `docs/AI_ARCHITECTURE.md`, `PORTFOLIO-NOTE.md`

`project/Notes.dc.html` and `project/_ds/modernist-*/` cover SignatureMaker only. The ChartGenie files do not import the Modernist stylesheet; they carry their own inline identity.

## 1. Design identity (what the files actually specify)

| Token | Design value | Current product |
|---|---|---|
| Display type | Bricolage Grotesque 800, tracking -0.03em | Plus Jakarta Sans |
| UI type | Geist 400/500/600 | Plus Jakarta Sans |
| Mono | Geist Mono 500, 11px | JetBrains Mono |
| Ground | warm paper `#f6f3ee`, panels `#fbf9f6`, artboard well `#efebe4`, page `#e9e5de` | cool `#f1f5f9` |
| Ink | slate `#1e293b`, secondary `#4b5563` / `#6b7280` | `#0f172a` / `#475569` |
| Accent | teal `#0e9384` (hover `#0b6f65`, tint `#d9f2ee`), rail mark `#2dd4bf` | blue `#2563eb`, cyan `#06b6d4` |
| Data palette | teal `#0e9384`, slate `#1e293b`, amber `#e0a33a`, coral `#e26d5a` | 12 schemes |
| Borders | `#d6d0c6` strong, `#e3ded6` soft, `#efeae2` row rule | slate-200 |
| Radius | 6 (inputs), 8 (buttons), 10 (cards), 12 (artboard), 999 (chips) | 8/12/16 |
| Shell | 72px dark rail + 60px top bar; editor grid 300 / 1fr / 280 (v1) → 280 / 1fr / 320 (v2) | header + 2-column |
| Artboard | true post size shown at 50%, only element with a shadow | canvas card |

Modernist DS (Archivo, red `#ec3013`, zero radius, 2px rules) is **not** the ChartGenie direction. Adopting it would contradict every ChartGenie screen in the bundle.

## 2. Screen-by-screen: design vs product

### Templates (v1 screen 1)
- Design: gallery of finished "looks" with sample numbers inside, category chips (Popular / Bars / Trends / Compare / KPIs / Funnels / Matrix / All · 17), "Use this" opens the editor, dashed "Start blank with sample data" card, Recent shelf at the bottom.
- Product: 17-type ChartTypeBar above the canvas + a separate TemplateGallery modal with 20 named presets (viral memes, tech, finance, business). Recent charts live in the My Charts modal.
- Gap: the 7 looks shown (Conversion Funnel, Growth Line · Dark, Ranked Bars, KPI Headline, Before / After, Donut Share, Priority Matrix) map to funnel, line, horizontalBar, **none**, bar, donut, **none**. KPI Headline (single stat + delta) and 2×2 Priority Matrix are not chart types today. Category chips claim "All · 17", which is true only if the gallery is built from the 17 real types.

### Editor (v1 screen 2, v2 screen 2)
- Design: data grid left (label / value / colour dot, Tab moves, Enter adds a row, trailing empty row), Import menu (Paste text, CSV, Sort, Sample data), Text on chart (title, subtitle, source). Centre: post-size chips with real pixel size ("1600 × 900 px · shown at 50%"), artboard, Look strip (chart type dropdown + Clean / Bold / Dark / Newsletter presets, Copy PNG). Right: Palette (3 shown), Values (Number + % / Number / None), Depth (3D) toggle, Show my handle toggle, Handle field, "Also export as" SVG / Table / Copy link. Top-right: Autosaved indicator, Share link, Export PNG ▾.
- v2 adds: Units segmented control (123 / % / $ / k-M), "% of total" chip, "↻ Repull sheet", ⌘↑↓ reorder and ⌘D duplicate, Insights / Caption / Style tabs on the right, callout annotations on the artboard, Post-ready ✓ chip with four checks (label contrast, min text size at 1080, X crop zone, alt text), Export set (16:9 + 1:1 + 9:16 + 4:3 toggles → zip with PNG + SVG each + caption.txt + alt-text), "Copy PNG + caption", "Apply my brand", Safe zones overlay.
- Product today: Content / Style / Settings tabs in one left panel; per-row inputs with up/down/duplicate/delete buttons; Smart Parser, Auto Emoji, Upload CSV, Paste Text, Desc sort, Mock data; 12 colour schemes, 6 canvas modes, 5 fonts, legend/values/3D/watermark/grid/callout metric/average line/creator handle/font size; format chips; 3D toggle, Reddit Table, Copy PNG, fullscreen; Export modal with PNG 1x/2x/4x, SVG, CSV, native share; Get share link (whole state base64 in the URL hash).
- Gaps: everything in the v2 right column is new logic (insights, caption, checks, export set). Palette shows 3 swatches where the product has 12 schemes; Look presets (Clean / Bold / Dark / Newsletter) do not exist; units column does not exist; keyboard grid navigation does not exist; autosave exists but is not surfaced.

### My charts (v1 screen 3)
- Design: 3-column shelf with real-aspect thumbnails, "16:9 · edited 2 min ago · shared", Duplicate / Open, filters (All · 6, Shared · 2, 16:9, 1:1, 9:16), "Saved in this browser · export a backup", "Duplicate last month's chart" card, and a **Shared links** table with `chartgenie.xyz/s/countries-3f9a`, view counts and Copy.
- Product: SavedChartsModal (list), JSON backup/restore exists, "shared" status does not exist, no short links, no view counts.

### Intake (v2 screen 1)
- Design: paste box detecting rows (Cells / Sentence / Screenshot / Sheet link / CSV), units detection (k, M, %, currency), "Continue with these rows", three ranked chart suggestions with reasons, insights preview. Rail: New / Templates / My charts / Series / Brand.
- Product: Smart Parser modal (local regex) already handles sentences and cells, detects currency/percent/multipliers and recommends a type. No screenshot, no sheet link, no ranked three-way suggestion UI.

### Share page (v2 screen 3)
- Design: public page with the live chart, author handle, "published 2 min ago · 14 views", caption, data table, "Remix with your numbers", Download PNG, Copy data, "Made with ChartGenie — free, in the browser", remix credit line.
- Product: share link opens the editor with state from the hash. No dedicated page, no counts, no remix.

### Series & Brand (v2 screen 4)
- Design: recurring charts with "Due today", last month faded behind the new bars, "Update & export set", "Skip this month"; Brand kit with palette, type pair, badge + logo, "Apply to every new chart", "Saved in this browser. Sign in later to sync… nothing is required."
- Product: creator handle only. No brand kit, no series.

### Mobile quick post (v2 screen 5)
- Design: paste → "See 3 charts" → pick size / look → caption → "Share image + caption". Text says "the full editor stays desktop-only".
- Product: the full editor works on phones (audit F-001…F-011 fixed it at 320/390). Making the phone quick-post-only would remove working capability.

## 3. Conflicts, dishonest claims, and external dependencies

### A. Claims the code cannot keep as drawn
1. **Account avatar in the rail ("H · @Hussain")** implies a signed-in user. No accounts exist and the promise is no-account. Render the stored handle chip only; "Set your handle" when empty. Never hardcode "@Hussain".
2. **"14 views", "3 views", "published 2 min ago", "shared" status, `chartgenie.xyz/s/<slug>`** require a server that stores published charts and counts views. Today a share link is the whole chart state in the URL hash; nothing is stored anywhere. Two honest paths: keep hash links (no counts, "shared" = "you copied a link", stored locally) or add a backend (see D).
3. **"Remix with your numbers" + "remixed from @Hussain" credit** are feasible without a backend only if the share page is rendered from the hash (`/s#<state>` or `/s?…`). Credit line then comes from the state itself.
4. **"Screenshot of a table is read in the browser"** needs on-device OCR (Tesseract.js, ~2–4 MB lazy-loaded, free) or a model call. Nothing exists today.
5. **Caption "Regenerate" with Plain / Punchy / Analyst tones** implies a language model. A local template composer can produce all three tones deterministically from the computed insights, but "Regenerate" would be a lie unless there are multiple templates per tone or a model call.
6. **"Sheet link … refresh numbers later repulls"** needs a fetch of a public Google Sheet. The CSV export endpoint often blocks browser CORS; a tiny Vercel function proxy (free tier) is the usual fix. Untested here; needs a spike before it is promised.
7. **"Colour-blind-safe variant generated automatically"** is only honest if implemented as a real CVD-safe palette derivation or a curated safe palette per brand. Cheap version: ship one Okabe-Ito-based safe palette and label it "colour-blind-safe palette".
8. **"Checked against X, LinkedIn and Instagram safe zones"** needs real crop rules as constants with a source and date; those rules change. Label them "as of <date>".
9. **Series "Due today"** can only be evaluated when the user opens the app. No reminders, no email, no push. Copy must say "next due" not "we'll remind you".
10. **"Text ≥ 24px at 1080"**, **"Label contrast 7.1:1"**, **"Alt text written"** are computable locally from the rendered SVG and the palette. Honest as long as the numbers are computed, not typed.
11. **"All · 17"** in the gallery must equal the real type count. If KPI Headline and Priority Matrix are added, the copy must update (or the gallery must draw from a single registry).
12. **"Sign in later to sync"** (Brand kit footer) promises a future feature. Either drop the sentence or keep "Saved in this browser" only.
13. Design sample data ("USA 87 / Italy 20 / UK 12 / Ireland 15", "MRR Q1–Q3", "Retention 87%") is illustrative. Only the existing sample dataset may be seeded, clearly labelled as sample; no fabricated "Recent" or "Shared links" rows.

### B. Conflicts with own docs
- PM/CMO review lists **"Generative AI"** and **"More chart types"** as non-goals for the next cycle and recommends trust → activation → acquisition → learning → distribution (durable links) → monetisation. v2 pulls distribution (share page), two new chart types, and optional model calls forward.
- PORTFOLIO-NOTE: cloud save/publish must be explicit opt-in, durable public IDs need revocation. A backend-backed share page must include an "unpublish" path.
- AI_ARCHITECTURE.md describes a $0 Vercel function + Gemini structured-output design (never built). If captions or OCR go through a model, this is the document to reuse; `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` exist in Doppler `shared/prd`.
- release-claims test forbids "AI-powered", "never leaves your browser", "100% private". The redesign copy must stay inside that fence, and if a model call is added the privacy copy must say what is sent.
- UI-changes-never-touch-functionality rule (global): the redesign may not drop working controls as a side effect. See section C.

### C. Working features not present in the designs (must be kept or explicitly dropped)
Auto Emoji · Mock data · Desc sort · Upload CSV file · Reddit markdown table copy · Copy SVG code · CSV data export · PNG at 1x/2x/4x · native Web Share · fullscreen preview · 12 colour schemes · 6 canvas modes · 5 chart fonts · legend toggle · grid toggle · watermark toggle · callout metric · average / rule line · font size S/M/L · 20 named presets (viral / tech / finance / business) · JSON backup + restore · welcome pill · confetti + haptics · PWA install + service worker · three SEO landing routes (`/pie-chart-maker`, `/bar-graph-maker`, `/convert-excel-to-chart`) · SEO/AEO section below the fold · GA4 events without chart content.

Proposed placement (no capability lost): Emoji / Mock / Sort / CSV → Import ▾ menu and data-grid chips; Reddit table + SVG + CSV → "Also export as" and the Export ▾ menu; 12 schemes → the Palette row shows all, 3 visible + "more"; canvas modes → Look presets (Clean / Bold / Dark / Newsletter map onto them, extra modes stay under Style); fonts → Brand kit "Type"; legend / grid / watermark / callout / rule line / font size → Style tab; 20 presets → Templates gallery as real cards; backup → "export a backup" link (already in the design); SEO routes → unchanged, restyled shell.

### D. Needs a backend, key, or paid service
| Feature | Needs | Free option | Cost if paid |
|---|---|---|---|
| Durable share links, view counts, remix credit, unpublish | DB + API | Supabase (existing control-plane project) or Vercel KV free tier | free at this scale |
| Screenshot → rows | OCR | Tesseract.js on-device, lazy-loaded | Gemini Vision via Vercel fn, free tier |
| Caption tones / regenerate | LLM | local templates (no model) | Gemini free tier, key in Doppler |
| Sheet link repull | CORS proxy | Vercel serverless fn (free) | — |
| Export set zip | client lib | JSZip, lazy-loaded | — |
| Safe-zone / contrast / alt-text checks | none | local | — |
| Brand kit, Series, Insights, Suggestions, Units, ⌘K, keyboard grid | none | local | — |

Everything not in this table is plain browser code.

### E. Engineering constraints observed
- Bundle is already 856 KB (248 KB gzip). JSZip, Tesseract and any new chart libs must be dynamic imports.
- Fonts: Bricolage Grotesque, Geist and Geist Mono are on Google Fonts; self-hosting via `@fontsource` avoids a third-party request and keeps the privacy copy simple.
- Repo is public on GitHub (Actions would be free) but the check gate will be a local script per the standing rule.
- Vercel project `chartmaker` (team aimasterz), production alias `chartgenie.xyz` plus two `*.vercel.app` aliases; promote by `vercel deploy --prod` then re-alias.
- The 23 uncommitted files are audit fixes that are already live; they become the baseline commit.
