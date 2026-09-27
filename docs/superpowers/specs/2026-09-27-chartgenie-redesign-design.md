# ChartGenie redesign — design spec

Date: 2026-09-27 · Branch: `redesign/publish-loop` · Baseline: tag `baseline-2026-09-27` (commit 990be06)

Inputs: `docs/design-handoff-2026-09-27/project/ChartGenie Redesign.dc.html` (base), `…/ChartGenie Redesign v2.dc.html` (reimagined), `docs/design-handoff-2026-09-27/GAP-ANALYSIS.md`, `docs/CHARTGENIE-PM-CMO-REVIEW-2026-09-26.md`, `PORTFOLIO-NOTE.md`.

## 1. Product statement

ChartGenie turns numbers into a post. Paste anything, get three chart suggestions and the facts inside the data, pick a look, export every post size at once, share a link that unfurls as a card and invites a remix. Free, no account, everything saved in this browser.

Decisions taken on the owner's behalf (they delegated on 2026-09-27, weighing user experience, current and future portal features, and ease of development):

| Decision | Choice | Reason |
|---|---|---|
| Design identity | The design's own tokens (Bricolage Grotesque, Geist, Geist Mono, warm paper, slate ink, teal accent). Not Modernist. | It is what the ChartGenie screens specify. |
| Chart engine | Apache ECharts (SVG renderer, tree-shaken) draws the plot; our own thin frame (title, subtitle, badge, footer, callouts) wraps it. One `ChartSpec → EChartsOption` builder per type. Recharts and the `div` charts are retired. | Verified 2026-09-27: ECharts 6.1 renders SVG strings in Node with zero dependencies (`init(null,null,{renderer:'svg',ssr:true})` + `renderToSVGString()`) and accepts our text measurer via `setPlatformAPI`, so preview, export and the link card share one path. Native funnel, gauge, pie, radar, heatmap, scatter, stacked bars/lines, label collision avoidance, markLine/markPoint/graphic for callouts, and dozens more types (sankey, treemap, sunburst, calendar, boxplot) for later. Replaces ~3,000 lines of bespoke mark code with ~600 lines of option builders. Cost: ~220 KB gzip chart chunk, lazy-loaded. Alternatives measured: Vega+Vega-Lite 252 KB gz (grammar awkward for funnel/KPI), Observable Plot 67 KB gz (no arcs, DOM-only server render), RAWGraphs app (Apache 2.0, DOM/d3, designer mapping paradigm, no looks/sizes/share — a fork would keep none of the UI). |
| Server | Stateless Vercel Edge functions only: `/s/<state>` link card (OG image) and later a Google-Sheets CSV proxy. Nothing stored, no logs of content, no accounts. | Rich link previews are the engagement lever; storage would break the local promise. |
| Intelligence | On-device only. Chrome built-in Prompt API when available, deterministic templates otherwise. Insights and suggestions are plain statistics. | No data leaves the device; templates keep every claim true when no model exists. WebLLM deferred (download UX). |
| Storage | Dexie (IndexedDB) with versioned schema; one-time import of the two localStorage keys. | Thumbnails and brand logos need blobs; migrations are explicit. Yjs deferred. |
| Routing / state | TanStack Router (typed, file routes) · Zustand + Immer + zundo (undo/redo) | Six real screens plus SEO routes; undo is table stakes in an editor. |
| Export | resvg-wasm in a Web Worker + JSZip, fonts embedded | Exact 1080 / 1600 px PNGs, real vector SVG, parallel export set. |
| PWA | vite-plugin-pwa (Workbox), Web Share Target, File Handling | Share sheet → ChartGenie on phones; open CSV files directly. |
| Palette / checks | culori (OKLCH, CVD simulation) · apca-w3 | Brand palettes and "colour-blind-safe" / "contrast ✓" become computed. |
| Command palette | cmdk | ⌘K for every action. |
| Mobile | Quick-post flow is the phone default; the full editor stays reachable. | Never remove a working capability. |
| Quality gate | Vitest + Testing Library, Playwright at 1440 and 390 with screenshot assertions, tsc, oxlint, bundle budget, all in `scripts/check.sh`. No hosted CI. | Repo rule: no paid CI. |

Dropped on purpose (owner asked not to keep things because they exist): Auto Emoji, Mock data, confetti, welcome pill, Reddit markdown table, PNG scale picker, learning loop, haptics, the 12 colour schemes (replaced by 6 curated palettes + brand kit), the 6 canvas modes (replaced by 4 Looks), the 5 chart fonts (replaced by the type pair and, later, brand type). Everything else in GAP-ANALYSIS §C is kept and relocated.

## 2. Screens and routes

| Route | Screen | Design source |
|---|---|---|
| `/` | Templates (front door for new visitors; returning visitors with saved charts land on `/new`) | v1 screen 1 |
| `/new` | Intake: paste anything, three suggestions, insights preview | v2 screen 1 |
| `/edit/:id` | Editor: data left, artboard centre, Insights / Caption / Style right | v1 screen 2 + v2 screen 2 |
| `/charts` | My charts shelf, shared links you copied, backup | v1 screen 3 |
| `/series` | Recurring charts | v2 screen 4 left |
| `/brand` | Brand kit | v2 screen 4 right |
| `/s/:state` | Share page: chart, caption, table, Remix, Download, Copy data; server renders the OG card | v2 screen 3 |
| `/pie-chart-maker`, `/bar-graph-maker`, `/convert-excel-to-chart` | Existing SEO landings, restyled in the new shell, each opening the editor pre-set | current |
| unknown | 404 in the shell | current behaviour |

Shell: 72 px dark rail (New · Templates · My charts · Series · Brand; handle chip at the bottom, "Set handle" when empty) + 60 px top bar (brand / breadcrumb / contextual actions; Autosaved dot; Share; Export set ▾). Under 900 px the rail becomes a bottom tab bar and the editor stacks: artboard, then data, then style.

### 2.1 Templates
- Header: search input (filters by name, type, category), "Paste numbers" → `/new`, "Blank chart" → editor with sample rows.
- Chips: Popular · Bars · Trends · Compare · KPIs · Funnels · Matrix · All · N. N is `CHART_TYPES.length` (19).
- Cards: one per look, rendered by the real renderer from that look's sample spec at 16:9, title, type line, "Use this". The 20 legacy presets become gallery cards under their categories (viral / tech / finance / business) with their data as the sample.
- Dashed card "Start blank with sample data".
- Recent shelf: last three saved charts with real thumbnails; hidden when there are none (no placeholder rows).

### 2.2 Intake
- Paste box (textarea, also accepts drop and file input). Detection runs on every change: rows, units, label/value columns, dates. Chips show the detected kind: Cells · Sentence · CSV. "Sheet link" chip appears only when the proxy feature ships. Screenshot chip is not shown.
- "Continue with these rows →" opens the editor with the best suggestion applied.
- Right column: three ranked suggestions with reasons, each "Use", rendered live from the parsed rows. "All N looks" opens the type picker.
- Insights preview line from `insights(rows)`.
- Units control: 123 · % · $ · k/M.

### 2.3 Editor
- Left (280): Data grid. Columns: colour dot, label, value, unit. Tab moves across, Enter adds a row, Backspace on an empty row removes it, ⌘↑/⌘↓ reorder, ⌘D duplicate, paste of multi-line text fills rows. Footer: total · average · key hints. Chips: Import ▾ (Paste text, CSV file, Sample data), Sort ↓, % of total. Text on chart: title, subtitle, source.
- Centre: Preview chip row (16:9 · 1:1 · 9:16 · 4:3) with the real pixel size and zoom ("1600 × 900 · 50%"); Safe zones toggle (X / LinkedIn / Instagram overlays, rules as dated constants); artboard rendered by `<Chart spec/>` at true post size scaled to fit; Look strip: type dropdown, Look chips (Clean · Bold · Dark · Newsletter), "Apply my brand", Copy PNG, Copy PNG + caption.
- Right (320): tabs Insights · Caption · Style.
  - Insights: chips computed from the data; tap adds a callout on the chart (positioned by the layout at the referenced mark) or removes it.
  - Caption: draft per tone (Plain · Punchy · Analyst), editable textarea, "Copy", hashtags off by default. "Regenerate" appears only when a built-in model is available and produces a new draft; otherwise the button is absent.
  - Style: palette (6 curated + brand), values mode (Number + % · Number · None), legend, grid, rule line (average / custom), depth (3D), show handle, handle field.
  - Export set: toggles per size, "PNG + SVG each, caption.txt, alt-text.txt, zipped". Checks list: label contrast (APCA, computed), text ≥ 24 px at the smallest enabled size, nothing in the enabled platforms' crop zones, alt text present. "Post-ready ✓" chip in the top bar reflects all checks passing.
- Top bar: breadcrumb "ChartGenie / <title>", Post-ready chip, Autosaved dot, Share (copies `/s/<state>` and shows the local-only `#state` alternative), Export set ▾ (Export set zip, PNG current size, SVG, CSV, Copy data).
- Undo/redo: ⌘Z / ⇧⌘Z across data, text and style.

### 2.4 My charts
- Filters: All · N, Shared · N (charts you copied a share link for), sizes.
- Cards: real thumbnail at the chart's aspect (rendered SVG, cached as a blob), title, "16:9 · edited <relative time> · shared", Duplicate, Open. Delete is in the card menu with undo toast.
- "Saved in this browser · export a backup / restore".
- Duplicate-last-month card appears only when a chart is older than 28 days.
- Shared links table lists links you copied (URL, title, copied date, Copy). No view counts.

### 2.5 Series
- A series = chart id + cadence (weekly · monthly · quarterly) + next due date + history of snapshots.
- Card "Due" when `now ≥ nextDue`, otherwise "next <date>". Paste box accepts the new values by label; previous snapshot renders faded behind the new marks (renderer option `ghost`). "Update & export set" saves a snapshot, advances the due date, opens the export set. "Skip this month" advances only.
- If the PWA is installed and notifications were granted, a local notification fires on the due date while the app is open or via the service worker's periodic sync where supported. Copy says "shown in the app".

### 2.6 Brand
- Palette: 1–6 swatches (OKLCH pickers), auto-generated tints, CVD preview (culori deuteranopia / protanopia / tritanopia simulation) and a "safe" toggle that swaps to an Okabe-Ito-derived palette with the same hue order.
- Type: the pair is fixed for now (Bricolage Grotesque headline, Geist labels); shown, not editable.
- Badge: handle text, optional logo (PNG/SVG ≤ 200 KB stored as blob), corner.
- "Apply to every new chart" toggle.
- Footer: "Saved in this browser." No sync promise.

### 2.7 Share page `/s/:state`
- `state` is the chart spec, gzip + base64url, in the path. Client decodes and renders. Server (edge) decodes and renders the same spec through `svgString` → resvg → PNG for `og:image`, `twitter:image`, title and description from the spec. Handles up to 8 KB of path; longer specs fall back to `#state` (client-only, generic card).
- Page: chart, handle, title, caption, data table, "Remix with your numbers" (opens editor with the spec, values cleared, `remixedFrom: handle`), Download PNG, Copy data. Footer: "Made with ChartGenie, free, in the browser."
- Remix credit line renders on the chart only while `remixedFrom` is set; removable in Style.
- Existing `#state` links (base64 JSON from `urlState.ts`) keep working through a converter.

### 2.8 Mobile quick post (`/new` under 900 px)
- Paste → "See 3 charts" → size chips (1:1 default) → artboard → look chips → caption card → "Share image + caption" (Web Share with files) and ⋯ (Open full editor, Save, Export set).
- Web Share Target: text and CSV shared into the app open `/new` with the box filled.

## 3. Chart engine (`src/chart/`)

```
ChartSpec {
  v: 2
  type: ChartType (19)
  data: Row[]            { id, label, value, unit?, color?, group? }
  text: { title, subtitle?, source? }
  size: PostSize          { id: '16:9'|'1:1'|'9:16'|'4:3', w, h }
  look: LookId            'clean'|'bold'|'dark'|'newsletter'
  palette: string[]       hex
  values: 'number+pct'|'number'|'none'
  options: { legend, grid, rule?: {kind:'avg'}|{kind:'value', value}, depth, handle?: string, showHandle, remixedFrom?, ghost?: Row[] }
  callouts: Callout[]     { id, insightId, text, anchor: {rowId} }
}
```

Pipeline: `frame(spec, measure) → Frame` (title, subtitle, badge, footer, remix line, plot box) → `plotOption(spec, frame) → EChartsOption` (one builder per type, SVG renderer, `animation:false`) → ECharts renders the plot box to an SVG string (browser: `echarts.init(el,…)` for the live artboard; export and server: `init(null,null,{renderer:'svg',ssr:true,width,height})` + `renderToSVGString()`) → `compose(frame, plotSvg, callouts)` → one SVG string (fonts embedded as `@font-face` data URIs for export) → `checks(frame, plotSvg)` parses the plot's `<text>` nodes for positions and fills.

`measure` is `canvas.measureText` in the browser and a shipped metrics table (advance widths per glyph for the three fonts) on the server, installed into ECharts with `setPlatformAPI({ measureText })`, so layouts agree.

Types (19): pie, donut, bar, horizontalBar, stackedBar, stackedColumn, stackedHorizontal, line, stackedLine, area, stackedArea, radar, scatter, heatmap, threshold, gauge, funnel, **kpi**, **matrix**. Stacked types use `group`. Matrix uses `x`/`y` fields on rows (added to Row as optional numbers) with quadrant labels in options.

Built by us: frame + title block + handle badge + footer + remix line; callout annotations (positioned from ECharts' rendered label boxes via `chart.convertToPixel` in the browser and parsed SVG on the server); ghost layer (a second series at 35% opacity); depth as `itemStyle` gradient + `shadowBlur`; KPI headline (ECharts `graphic` text elements) and 2×2 matrix (scatter + `markLine` quadrants + `graphic` quadrant labels). Everything else (scales, axes, gridlines, legend, label collision `labelLayout:{hideOverlap:true}`, funnel, gauge, pie/donut label lines, radar, heatmap with `visualMap`) is ECharts configuration.

Looks are token sets: background, ink, muted, grid, radius, title size, label size, bar gap. `newsletter` is white with a 1 px border and serifless heavy title; `bold` is larger type and full-bleed bars; `dark` is slate ink inverted.

Checks: APCA contrast for every text box against its background ≥ 60 (labels) / 75 (title); min text size ≥ 24 px at the smallest enabled export; no text box intersects a platform crop zone; alt text = `${title}: ${top insight}` present. Each check returns `{ id, pass, detail }`.

Insights (`src/insights/`): largest, smallest, share of total, ratio to next, average, delta first→last, trend direction (for dates), sum-to-100 detection. Each `{ id, text, rowId?, value }`.

Suggestions (`src/insights/suggest.ts`): rules from data shape → ranked `[ { type, reason } ]` (two rows → bar "before/after"; dates → line; parts summing to ~100 → donut; ranked list ≥ 4 → horizontalBar or funnel when monotonic decreasing; one row → kpi; rows with x/y → matrix).

Caption (`src/caption/`): templates per tone consuming title + top two insights; optional `window.LanguageModel` (Chrome Prompt API) rewrite with the template as fallback and a 3 s timeout.

## 4. Data and storage (`src/db/`)

Dexie database `chartgenie` v1: `charts` (id, spec, thumbnail Blob, updatedAt, createdAt, sharedAt?), `series` (id, chartId, cadence, nextDue, snapshots[]), `brand` (singleton), `settings` (handle, lastRoute). On first run, `chartgenie_saved_charts_v1` and `chartgenie_autosave_v1` are converted (`SavedChart → ChartSpec`) and the keys renamed to `*_migrated` (never deleted). Backup export/import is JSON of all tables; import validates with a schema and never overwrites without confirmation.

Autosave: debounced 400 ms into `charts`; the top bar dot reflects pending/saved/error.

## 5. Server (`api/`)

Two Vercel serverless functions (Node runtime, chosen over Edge for ease of development: `@resvg/resvg-js` ships native binaries and `react-dom/server` runs unchanged): `api/share.ts` serves `/s/:state` by injecting `og:image`, `twitter:image`, title and description into the built `index.html`; `api/og.ts` serves `/s/:state/og.png`: decode → validate spec (zod, size caps) → `svgString` → resvg → PNG, `Cache-Control: public, max-age=31536000, immutable` keyed by the state. No logging of the decoded content. Later: `api/sheet.ts` restricted to `docs.google.com/spreadsheets/*` export URLs, 200 KB cap, 10 s timeout.

## 6. Analytics

GA4 stays with content-free events: `intake_detect{kind, rows}`, `suggestion_use{type, rank}`, `export_set{sizes, formats}`, `share_copy{mode}`, `remix_open`, `series_update`, `brand_apply`, `check_fail{id}`. Titles, labels, values and captions are never sent.

## 7. Claims register

User-facing copy must stay inside `src/test/release-claims.test.ts`, extended to forbid "AI-powered", "view count", "synced", "we'll remind you". New allowed claims, each backed by code: "share links unfurl with a preview", "checked for contrast and crop zones", "captions drafted on your device", "saved in this browser", "export every size at once".

## 8. Testing

- Unit: layout/marks per type (snapshot of `svgString` at each size × look), insights, suggestions, caption templates, checks, intake parser, Dexie migration, state codec (round trip, legacy `#state`).
- Component: each screen with Testing Library (contract: every control listed in §2 present and operable).
- Browser (Playwright): the five flows at 1440 and 390: paste → export set; template → edit → share → remix; series update; brand apply; legacy link opens. Screenshot assertions per screen at both widths.
- Golden PNGs for 6 representative specs through the worker export.
- `scripts/check.sh`: tsc, oxlint, vitest, build, bundle budget (entry chunk ≤ 150 KB gzip; ECharts chunk ≤ 240 KB gzip, loaded only on routes that draw a chart), Playwright.

## 9. Delivery

Branch `redesign/publish-loop`, task-by-task commits, Vercel preview per milestone, whole-branch review, `vercel deploy --prod`, re-alias `chartgenie.xyz`, merge to `main`, tag `v3.0.0`. Files replaced are moved to `.archive/` (never deleted).

## 10. Out of scope (this cycle)

Accounts and sync, view counts, WebLLM tier, screenshot OCR, Google Sheets proxy (planned as the first follow-up), Capacitor packaging, more chart types beyond 19.
