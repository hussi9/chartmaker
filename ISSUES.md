# ChartGenie growth issues register

Findings from the portal-growth SEO/GEO loop. Each row has evidence and an owner. Close a row with the commit that fixes it.

| ID | Sev | Finding | Evidence (2026-11-16) | Owner / state |
|---|---|---|---|---|
| G-01 | High | Landing pages had no h1 or body text in raw HTML (crawlers without JS saw an empty root). | Live curl of `/`, `/pie-chart-maker`, `/bar-graph-maker`, `/convert-excel-to-chart`: `<div id="root"></div>`. | Fixed in `d9c29be`, live 2026-11-16. Verify again after the next deploy. |
| G-02 | High | GA4 counting not verified. Page sends `page_view` to `g/collect` with `G-96D837GEH9`, but GA4 reports access is denied. | Browser network trace on live pages. `docs/growth-search-review-2026-09-29.md`: `ga4_access_denied`. | Owner: grant GA Viewer to reporting identity `aimasterz-workspace@aimasterz.iam.gserviceaccount.com` on the ChartGenie property (confirm which of 556006890 / 555878968). |
| G-03 | High | Search Console and Ahrefs data unavailable through the connected SEO tool ("Insufficient plan"). No own-demand or volume data. | gsc-* and keywords-explorer-* calls returned -32001. | Owner: verify chartgenie.xyz in Search Console, or upgrade the connector plan, or send a Search Console export. |
| G-04 | Medium | Consent default is granted for analytics in every region. Automated security review flags opt-out model for EEA/UK/CH (GDPR/ePrivacy). | `src/lib/gtag.ts` `CONSENT_DEFAULTS`; owner decision 2026-10-16 recorded in the file comment. Security review finding, 2026-11-16. | Owner decision: keep, or add region-scoped denial. |
| G-05 | Medium | FAQPage schema absent on all live pages, though visible Q&A now exists. | Live JSON-LD types: WebApplication, Offer, Organization, ImageObject, WebPage (+BreadcrumbList). The repo's `index.html` once had FAQPage. | Low signal per Google AI-features guidance. Add only matching the visible Q&A. |
| G-06 | Medium | llms.txt links none of the landing pages. | `public/llms.txt` has 0 markdown links to chartgenie.xyz pages. | Owner yes needed (llms.txt change is an approval item). |
| G-07 | Low | Stale service worker shell serves old app to returning visitors after a deploy. Only the first navigation after a deploy; `skipWaiting` on install already limits it. Worse after a rollback. | Reproduced 2026-11-16: browser served old precache, `/line-graph-maker` showed "Nothing here." Cleared by unregistering the worker. | Low. No fix yet. Consider `clientsClaim` and a reload on `controllerchange`. |
| G-08 | Low | Tool page titles are short (28-29 chars) and have no query-intent words beyond the tool name. | Live `<title>`: "Pie Chart Maker — ChartGenie", "Bar Graph Maker — ChartGenie", "Line Graph Maker — ChartGenie". | Low. Test only after G-02 gives a baseline. |
| G-09 | Low | Line page is not yet crawled or indexed (no Search Console data to check). | Live sitemap has 5 URLs. | Read indexing on 2026-11-23 (day 7) once G-03 is solved. |
| G-10 | Info | Demand data unavailable. Rivals found in standard search (no volumes): Amplitude, Venngage, Piktochart, Datylon, Visme, MiniWebtool, Kanaries, Fotor, Everviz. | WebSearch 2026-11-16. Vendor "no sign-up" claims are unverified. | Revisit once G-03 is solved. |

## ICE backlog (impact × confidence × ease, 1–10 each; judgment, no volumes)

1. G-02 GA4 access (owner) · ICE 9 × 9 × 3
2. G-03 Search Console access (owner) · ICE 8 × 7 × 2
3. G-06 llms.txt links to tool pages (owner yes) · ICE 5 × 8 × 9
4. G-05 FAQPage matching visible Q&A · ICE 3 × 6 × 6
5. Next chart-type page (donut or area) only after G-09 read · ICE 6 × 6 × 6
6. G-07 service worker clientsClaim/reload · ICE 2 × 6 × 6
7. G-04 consent region decision (owner) · not ICE-scored (policy)

## Measurement schedule (line page live 2026-11-16)

- 2026-11-23 (day 7): read `/line-graph-maker` index status and clicks, if G-03 is closed. Read GA4 counts for all tool pages, if G-02 is closed.
- 2026-12-14 (day 28): read Search Console and GA4 against the plan's expected signal. Keep, change, or stop each action.
- 2026-01-15 (day 60): read again, record the decision.

Until G-02 and G-03 close, no growth claim is made. Zero visits or zero impressions are unreadable, not zero.

## Status update 2026-11-16 (same day, after owner authority to proceed)

- **G-05 closed** in `b5f0fa6`. The landing now shows the same Q&A that the static HTML carries, and FAQPage is emitted from that same data. Test asserts they match on every route. Live: one FAQPage per page.
- **G-06 closed** in `b5f0fa6`. llms.txt now links the line page. Live: confirmed. Owner note: the working-tree `public/llms.txt` has an uncommitted change that describes optional accounts with a Supabase identity. Accounts are not shipped, so that text was not included. Resolve it before committing that copy.
- **G-07 unchanged**: low priority, no fix.
- **G-04 open**: owner decision on the consent default (granted shipped per owner choice; security review still flags EEA/UK/CH).
- **G-02, G-03 open**: owner actions in Google (GA Viewer grant, Search Console verification).
- **Incident (2026-11-16)**: a production deploy built from HEAD briefly reverted the owner's granted consent default. Rolled back, then redeployed with the granted set (`ccce88e`). Two deploys needed a manual `vercel alias set chartgenie.xyz` after reporting READY. Check the alias on every deploy.
