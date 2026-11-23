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

## Decision 2026-11-16

- **G-04 closed by owner decision: keep analytics granted by default in all regions.** The security review's EEA/UK/CH concern is accepted as a risk for now. Revisit only if counsel advises otherwise. No code change.

## Verified reads 2026-11-16 (metrics.py, read-only; window 2026-10-18 to 2026-11-14)

- **GA4** (property 556006890, hostName chartgenie.xyz only): 33 sessions, 32 users, 35 page views. Landing pages: `/` 31, `/brand` 1, `/new` 1. No sessions to any tool page in the window.
- **Search Console**: 2 clicks, 13 impressions, average position 21.5. Pages: home only. Queries: "chart genie" 1 click, 6 impressions. No impressions for any tool-page query.
- **Indexation** (URL Inspection, first 5 sitemap URLs): 1 of 5 indexed (home, last crawl 2026-10-19). Pie, bar, line and convert: "URL is unknown to Google".
- **Corrections**: G-02 and G-03 are closed. The Google service account reads GA4 and Search Console for this property; the earlier "access denied" note (2026-09-29 doc) is stale. The 556006890 ID is confirmed by the hostName match.
- **Sitemap**: already submitted by the parent session (HTTP 204, per the portal plan). Not re-submitted by this thread.
- **Stage 4 (query map, redo)**: no measured tool-page demand in the window, only brand. Rivals from standard search are unchanged (see the 2026-11-16 entries above). No volumes: keyword tools need a plan, DataForSEO top-up is the owner's call.
- **Consent (G-04)**: owner said "Keep granted" on 2026-11-16. The portal plan's "region list" wording conflicts. Not changed; owner to confirm which record stands.

## Decision record: consent (2026-11-16)

- **Decision:** analytics is granted by default in every region. No region-based denial. Ad signals stay denied and never upgrade.
- **Owner's words (chat, 2026-11-16):** "Keep granted".
- **Context:** the owner had earlier decided granted by default (2026-10-16, see the `gtag.ts` comment). A security review flagged EEA/UK/CH. The owner chose to keep granted, which outranks the earlier general consent note in PLAN.md.
- **Code:** `src/lib/gtag.ts` `CONSENT_DEFAULTS` `analytics_storage: 'granted'` (commit `ccce88e`).
- **Banner:** `src/components/MeasurementConsent.tsx` says "Analytics is on by default" (commit `ccce88e`).
- **Live:** `https://chartgenie.xyz` serves a bundle with the granted default (checked 2026-11-16 after the alias fix).
- **Revisit:** only on the owner's instruction, or counsel's advice.

## Test flake (2026-11-16)

- `src/test/index-route.test.tsx`, "shows the templates gallery for /?templates=1 even when a chart is already saved": failed once in a full run (693 tests), passed on the rerun and passes alone twice. Not caused by the embed change. Timing under load; record and watch.

## Production record and deploy rules (2026-11-16, from the parent session's report)

- **Production:** `growth/chartgenie-line-page` at `4c4a0fe`, deployment `dpl_2aa8YEASx6HrrTA61urdynZ2ZDqS`, built with `--prod` from the clean worktree `/private/tmp/cg-line-page`. Not a promoted preview, so production env applies.
- **Rule:** deploy only from this worktree. Do not merge into or touch the main checkout at `~/devpro/chartmaker`, which the parent reports has about 40 uncommitted older files and is 12 commits behind this branch.
- **Rule:** alias `chartgenie.xyz` only after a `--prod` deploy. Never alias `www`.
- **Incident (alias):** the parent briefly aliased `www.chartgenie.xyz`, which overrode its project-level 307 to the apex and showed an SSO wall. Removed. `www` is 307 to the apex again.
- **Verified by the parent after this deploy:** `chartgenie.xyz` 200 on a new bundle; consent default granted; GA id present; h1 on `/` and the four landing pages; sitemap and robots 200; unknown path 404; embed command in the lazy palette chunk.

## Production record 2026-11-23 (portal-growth weekly run)

- **Release:** IndexNow key file `public/7afad35f….txt`, commit `82d3abe` on `growth/chartgenie-indexnow-2026-11-23` (base `0c63da3`). Tests 693/693, build passed. Preview `chartmaker-ahimpn3gz` smoke: key and `/pie-chart-maker` h1 served. Production `dpl_HWnADFMhecJQxqwbhdtm3aNZ5s7G`.
- **Alias, again:** the `--prod` deploy did not move `chartgenie.xyz`, and `vercel alias set` now fails with "You don't have access to the domain". Fixed through the Vercel API (`POST /v2/deployments/<id>/aliases`, alias `chartgenie.xyz`, old `dpl_2aa8YEAS`). `www` untouched (307 to apex).
- **Verified live:** key 200 with the right body; `/` and the four chart pages 200 with h1; sitemap, robots, llms.txt 200; unknown path 404; GA id `G-96D837GEH9` and `analytics_storage:"granted"` in the live bundle. IndexNow: five URLs sent, HTTP 202.
- **Day-7 read:** the four chart pages are "URL is unknown to Google"; Search Console has never downloaded the sitemap (resubmitted 23 Nov, 204).

## Production record 2026-11-23 (sister-site links)

- **Release:** "Who makes it" section on `/privacy.html` (ChartGenie's one footer-level info page; there is no About page) listing MakeMyCalculator, MoneyVibe and SignatureMaker, plus one "built by AIMasterz" link. Commit `fc1f325` on `growth/chartgenie-sister-links-2026-11-23` (base `04cf745`). Owner request 23 Nov; portal network rule keeps sister links on one page, never sitewide.
- **Guard:** `src/test/sister-links.test.ts` pins the four links to `public/privacy.html` and fails if a sister domain appears in any other shipped file.
- **Checks:** vitest 697/697; `npm run build` passed; oxlint warnings only (pre-existing). Preview `chartmaker-lbsgq92oz` served the section. Production `dpl_KFPi6FbUdV6WiYMGNNswkNnohR8V`, aliased to `chartgenie.xyz` through the API (old `dpl_HWnADFMh`). `www` untouched (307 to apex).
- **Verified live:** `/privacy.html` has each link once; `/`, `/pie-chart-maker`, sitemap, robots, IndexNow key 200 with no sister links; unknown path 404.
