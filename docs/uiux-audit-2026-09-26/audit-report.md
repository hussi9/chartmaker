# ChartGenie UI/UX audit — 2026-09-26

## Decision brief

Evidence mode: mixed local browser interaction and repository inspection. This is a local beta audit, not production or physical-device proof. The strongest part of ChartGenie remains its immediately editable sample and live, attractive export preview. The mobile entry and editor failures were repaired in the first slice. A second slice repaired dark-canvas supporting text and added PNG/SVG failure feedback. Export framing and browser/device failure-path proof remain open.

The product direction remains “turn a few numbers or pasted rows into a polished, social-ready chart quickly.” Preserve the expressive blue/cyan identity, the usable density of an expert tool, guest access, multiple export formats, and the 17 chart choices. This audit does not infer conversion lift, WCAG conformance, or customer preference from a browser session.

## Context and boundary

- Audience and job: solo creators, marketers, founders, community managers, and analysts preparing a static chart for posts, newsletters, and slides. This is the audience proposed in [the PM/CMO review](../CHARTGENIE-PM-CMO-REVIEW-2026-09-26.md); no direct user research was supplied.
- Environment: Vite local server at `http://127.0.0.1:4173/`, Chrome on macOS, desktop 1440 × 900 and viewport overrides of 390 × 844 and 320 × 760 CSS px. The 320 and 390 views are emulation, not physical phones.
- Scope: root chart creation, `/pie-chart-maker` route entry, chart type selection, data editor, parser empty/error state, save success feedback, six canvas modes, and local SVG/PNG clipboard output. Existing trust-release changes in the dirty worktree were preserved.
- Exclusions: deployment, auth, billing, cloud storage, external sharing, and actual social posting. Downloaded file contents, mobile export, and browser-level export failure were not end-to-end validated.
- Reference: WCAG 2.2 AA was used as an audit lens for labels, focus, reflow, and contrast. No full conformance assessment or assistive-technology session was performed.

Browser screenshots were inspected inline at each named viewport. The browser control available in this session did not provide a supported way to persist its screenshot bytes under this folder, so the register names inline observations and measured geometry rather than claiming screenshot files exist.

## Coverage

The [register](audit-register.json) contains 13 coverage rows: 8 inspected, 3 partial, and 2 not tested. Desktop and both mobile widths were checked on the local root; the pie route was checked at 320 px. The parser's zero-result path and local save success were exercised. Dark-canvas text was checked in six modes; a copied SVG and PNG were inspected. Browser-level export failure, screen reader and physical touch, 200% text scaling, and complete keyboard traversal remain explicit gaps. No horizontal page overflow was measured after the mobile changes: `scrollWidth` was 314/320, 384/390, and 1434/1440 CSS px respectively; the six-pixel difference is browser scrollbar space.

### Critical journey

At the original 320 px first-run entry, the header was 237 px high, the welcome banner 126 px, and the preview began at document Y=406 px. The data editor began around Y=1358 px. At 390 px the header was 179 px, welcome 126 px, preview Y=348 px, chart selector Y=1130 px, and editor Y=1268 px. After the bounded changes, the header is 124 px, the banner 92 px, and the preview starts at Y=244 px at both narrow widths. An “Edit data” button at the preview focuses the first row label and scrolls the panel below the sticky header. At 320 px, the label field now measures 130 px and row actions 32 × 32 px; at 390 px the label measures 200 px. “Choose chart type” reveals and focuses the selected card in the horizontal rail; “View preview” returns focus to the preview region.

The desktop shell remains two-column. The chart selector and editor preserve their existing density. Export is first in visual and DOM order in the header; on narrow screens secondary actions remain in a horizontal rail.

## Findings and closure

### F-001 — mobile entry stacked above the result · S2 / P1 / high · verified

Observation: at 320 px the three-row header plus first-run banner consumed 363 px before the route heading or sample preview. Root cause: wrapped header actions and long welcome copy. User impact: predicted first-value delay and excess scrolling. Change: one-row horizontally scrollable actions led by Export, shorter welcome copy, and compact mobile spacing. The initial preview moved from Y=406 to Y=244 px at 320 px. Trade-off: secondary actions require a horizontal swipe. Acceptance was checked at 320 and 390 px without page overflow. See T-001 and F-010.

### F-002 — preview and editor were separated by a long scroll · S3 / P1 / high · verified

Observation: the first row was more than 1,300 px from the top at 320 px; mobile deliberately places the preview first. User impact: repeated movement between data, type, and output. Change: direct Edit data, View preview, and Choose chart type controls that scroll and move keyboard focus. The selected type is scrolled into the rail when focused. Preserved behavior: preview remains first and all chart types remain available. Acceptance was checked with keyboard focus and visible positions at 320 px. See T-002.

### F-003 — editor fields and row actions lacked usable names; labels collapsed on narrow screens · S3 / P1 / high · verified

Observation: browser accessibility state showed unnamed title, subtitle, source, row label, and numeric inputs; row action names repeated without row context. At 320 px the first label was roughly 26 px wide. Change: explicit accessible names, row-specific action names, and a second action line for each row under 600 px. The first label is now 130 px at 320 px and 200 px at 390 px. Trade-off: mobile rows are taller. Unit tests and local browser checks passed. This does not establish screen-reader usability or that 32 px buttons are comfortable on every device. See T-003 and G-003.

### F-004 — empty parser result offered an apparent apply action · S2 / P1 / high · verified

Observation: entering `words without numbers` returned “0 parsed rows — confirm each value” with “Use these rows” visible even though its handler silently returned. Change: the state now says “No values found. Enter at least two label and number pairs, then preview again,” and the apply action appears only for a usable preview. A failing test was observed before the change; the same error path was exercised in Chrome after it. Existing reviewed-row confirmation remains. See T-004.

### F-005 — current chart type was visual-only state · S2 / P1 / high · verified

Observation: selected category and chart cards were styled but did not expose pressed state. Change: `aria-pressed` on category and type buttons, and `aria-expanded` on More. The selected Pie card was shown in the rail and focused after keyboard navigation. The broader 17-choice comprehension question remains open. See T-005 and O-001.

### F-006 — pale header labels had weak contrast on white · S2 / P1 / high · verified

Observation: Share `#38bdf8` measured about 2.14:1 and Smart Parser `#d8b4fe` about 1.77:1 against white, below the normal-text 4.5:1 WCAG 2.2 AA reference. The local colors are now `#0369a1` (about 5.93:1) and `#6d28d9` (about 7.10:1). The small badge text was also darkened. Ratios use the solid specified color and white, not a full contrast inventory of every gradient and state. See T-006.

### F-007 — dark chart callout and legend lose legibility · S2 / P1 / high · verified locally

The original Dark canvas displayed the callout and legend in saturated chart colors over charcoal; Safari legend text was `rgb(94, 92, 230)`. `ChartCanvas.tsx` now uses each canvas mode's text token for callout, pie labels, legends, and key line/benchmark labels, while retaining palette colors on marks and legend icons. Nine focused tests went RED then GREEN. Chrome inspected supporting text in Light, Paper, Dark, Wrapped, OLED, and Slate. A real copied dark SVG contained the light text and callout; a copied PNG was rendered visually with readable white text. Exact contrast over every layered surface and physical-device output remain unverified. See T-007.

### F-008 — PNG/SVG export failure has no visible recovery · S3 / P1 / medium · implemented locally

Source inspection found that `ExportModal.tsx` caught PNG/SVG generation errors without a visible message. The modal now shows a specific `role=alert` message, keeps both formats available, clears it on retry, and explains a missing preview. Tests injected failures, checked retry success, and confirmed no false success callback on failure. A real browser failure was not induced, so this finding remains implemented pending browser/device proof. See T-008 and G-002.

### F-009 — chart choice density is a hypothesis to study · S2 / P2 / medium · open

Five popular cards, six categories, a More menu, and a “Showing 5 of 17” summary compete for attention. This is not evidence that 17 choices should be removed: the expert range is a product strength. Investigate whether a first-time task prompt and contextual type suggestions improve choice without hiding specialist types. Keep the current selector until tested with representative creators. See O-001/T-009.

### F-010 — secondary mobile header actions rely on horizontal discovery · S2 / P2 / high · open

The compact header keeps Export first and shows part of the next actions, while My Charts, Share, and Parser may require a swipe at 320/390 px. This is a measured space trade-off, not a blocked core job. Test mobile users' discovery before selecting a More menu or a bottom action surface. See T-010.

### F-011 — exported PNG included clipped interface controls · S3 / P1 / high · verified locally

A real copied dark PNG originally included the canvas footer's Get share link and a right-clipped Download button. Export-only filtering now excludes marked interface controls across PNG, SVG, clipboard, and direct-copy paths while preserving chart labels and attribution. A focused regression captured the real renderer behavior that passes Text nodes through its filter. Tests went RED then GREEN, and a settled 16:9 dark PNG/SVG was inspected locally without footer controls. Immediate export during theme animation can still capture an intermediate frame; that timing risk remains open under artifact/device verification.

### Coverage gaps

- G-001: local browser storage failure was covered by the existing automated save test, not induced in Chrome; verify failure toast/focus/recovery in a disposable browser profile (T-011).
- G-002: local SVG/PNG clipboard success was exercised, but downloaded files, browser-level generation failure, and mobile export were not validated (T-012).
- G-003: physical touch and VoiceOver/TalkBack behavior were not exercised; test the 32 px row actions, rail, preview jumps, and dialog (T-013).
- G-004: 200% text resize and 320 px reflow at 400% browser zoom were not exercised (T-014).
- G-005: full keyboard traversal of chart More and modal Escape/focus return was not exercised (T-015).

## Premium direction and trade-offs

1. Lead with a real output: keep the editable sample and make the first chart visible early. The mobile shortcut change follows this principle without removing expert controls.
2. Make the workflow reversible: each move between data, type, and preview should preserve values, scroll position, and visible focus. Check this with keyboard and touch.
3. Keep density where it earns its space: retain 17 types and advanced styling, but test task-oriented discovery before adding more controls or hiding existing ones.
4. Make every success claim exact: parser, save, and export feedback must reflect completed work. Keep failed operations visible and recoverable.

The trade-off of a one-row action rail is discoverability of secondary tools. The trade-off of two-line mobile data rows is greater vertical height. Neither is claimed to improve conversion without user research. A small moderated test with new and returning creators should measure time to first corrected value, type selection, export completion, and wrong turns.

## Quality profile

| Dimension | Assessment | Evidence and limit |
| --- | --- | --- |
| First value and hierarchy | Improved; needs user validation | E-003/E-004 baseline and E-008/E-009 local after geometry |
| Editing and navigation | Improved locally | E-009/E-010 focus and viewport checks; physical touch open |
| Accessibility semantics | Improved; partial | E-005/E-006 tests and AX; no screen reader or complete keyboard audit |
| Error and success feedback | Improved locally; partial | Parser and save checked; export failure alert tested, browser failure path open |
| Theme and visual craft | Supporting text and export framing improved locally | E-013/E-019/E-020/E-022; theme-transition timing and device matrix remain open |
| Responsive reflow | Adequate for sampled widths | No document overflow at sampled viewports; text zoom untested |
| Performance | Unassessed | No field or reproducible lab data in this slice |

## Evidence index and next handoff

Evidence IDs, exact conditions, closure status, and open test tasks are in [audit-register.json](audit-register.json). The [implementation plan](implementation-plan.md) distinguishes verified local work from planned and investigative work. Source and browser observations support a bounded local conclusion only; deployment, physical-device performance, and user response remain unknown.
