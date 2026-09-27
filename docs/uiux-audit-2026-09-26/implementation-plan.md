# ChartGenie UI/UX implementation plan

Date: 2026-09-26. Status below describes this local checkout only. It does not imply deployment or physical-device acceptance. Effort is a relative estimate for one frontend owner with the current codebase; S is hours, M is roughly a day, and L needs discovery. Reversal is a narrow revert of the named UI changes after preserving any later work.

## Phase 1 — completed local core path

| Task | Linked items | Owner / effort | Result and source | Status |
| --- | --- | --- | --- | --- |
| T-001 | F-001 | Frontend / S | Compact mobile header and welcome in `Header.tsx`, `App.tsx`, `index.css`; Export first in visual and DOM order | Verified locally |
| T-002 | F-002 | Frontend / M | Focus-aware Edit data, View preview, Choose chart type in `App.tsx`, `ControlPanel.tsx`, `ChartTypeBar.tsx`, `index.css` | Verified locally |
| T-003 | F-003 | Frontend / M | Named chart/row inputs and row-specific actions; two-line narrow rows in `ControlPanel.tsx`, `index.css` | Verified locally |
| T-004 | F-004 | Frontend / S | Explicit zero-row parser recovery and gated apply in `AiPromptModal.tsx` | Verified locally |
| T-005 | F-005 | Frontend / S | `aria-pressed` and `aria-expanded` on selector in `ChartTypeBar.tsx` | Verified locally |
| T-006 | F-006 | Frontend / S | Darker Share, Parser, and badge labels in `Header.tsx` | Verified locally |

Acceptance and evidence:

- T-001: Given a first visit at 320 and 390 CSS px, the preview appears without a three-row header, Export is visible first, and document width stays within the viewport. Browser measurements: 320 px preview Y=406 → 244; 390 px Y=348 → 244; no document overflow. Desktop still shows the two-column editor/preview.
- T-002: Given mobile preview, activating Edit data scrolls the content tab below the sticky header and focuses Row 1 label. Given the editor, View preview focuses the preview region; Choose chart type focuses and visibly reveals the selected card. Chrome at 320 px showed selected Pie at left=103/right=211 and the preview at top=132 below header bottom=124.
- T-003: Given root sample data, title, subtitle, data source, labels, values, and each action have specific accessible names. At 320/390 px, labels measure at least 130/200 px and row actions 32 × 32 px. At desktop, row density remains compact. This is browser geometry and AX evidence, not physical-device target proof.
- T-004: Given text with no values, Preview rows explains the needed label/number pairs and does not offer Use these rows. Given valid pairs, the existing review-and-apply path remains. Automated RED then GREEN and local Chrome error-path checks passed.
- T-005: Given a selected category and chart, each button exposes the pressed state; More exposes expanded state. A selected card remains keyboard focusable and visible after shortcut navigation. Automated RED then GREEN and browser AX checks passed.
- T-006: Given white header buttons, Share and Smart Parser label colors reach about 5.93:1 and 7.10:1 against white respectively, calculated from specified solid colors. Other canvas/theme combinations remain separate work.

The test-first record is `src/test/uiux-audit.test.tsx`: four original tests failed for the expected missing labels/shortcut/pressed/error behavior; subsequent tests failed for header order, row action names, return controls, and hidden focused type before each production change. All seven final tests passed. Existing repository tests remain a separate verification gate.

Phase exit: local first-run and returning-user flows at sampled widths work, tests pass, build/lint pass, and open findings remain visible in the register. No release status changes from this phase.

## Phase 2 — local P1 contrast and export feedback

### T-007 · dark canvas supporting text (F-007)

Owner: frontend/design; effort M. Affected: `src/components/ChartCanvas.tsx`, plus exported chart output. Status: verified locally. Theme text tokens now style callouts, pie labels, legends, and key line/benchmark labels; palette colors remain on chart marks and icons. Given each of six canvas modes, supporting text matched its mode token in Chrome. A real dark SVG included the callout and light text; a copied PNG was visually inspected. Nine tests in `src/test/p1-uiux.test.tsx` went RED then GREEN. Exact layered contrast and physical devices remain open; export framing moved to verified T-016.

### T-008 · export failure recovery (F-008)

Owner: frontend; effort M. Affected: `src/components/ExportModal.tsx` and `src/test/p1-uiux.test.tsx`. Status: implemented locally. Given injected PNG/SVG generation rejection, the modal remains available, announces a specific failure via `role=alert`, and offers retry or the alternate format without a false success callback. The alert clears on a successful retry; missing preview has separate guidance. Tests observed RED then GREEN. Local Chrome proved successful SVG/PNG clipboard export, but a browser generation failure was not induced; G-002 remains open.

Phase exit: F-007 and F-011 have local test and browser/export-output proof. F-008 has test-first failure-path proof and successful browser output, with browser failure injection and device checks still required before full closure.

### T-016 · remove interface controls from exported chart (F-011)

Owner: frontend; effort M. Affected: `src/lib/chartExport.ts`, `src/components/ChartCanvas.tsx`, `src/components/ExportModal.tsx`, and direct-copy paths. Status: verified locally. The export-only filter preserves chart labels, attribution and source while excluding marked interface controls. Artifact and real-renderer Text-node tests went RED then GREEN. A settled 16:9 dark PNG/SVG was inspected locally without footer controls or clipping. Other aspect ratios, immediate theme-transition timing and physical devices remain part of T-012.

## Phase 3 — investigate and validate without stripping expert capability

### T-009 · chart choice study (F-009, O-001)

Owner: product/design; effort M–L, dependent on access to representative new and repeat creators. Compare the current five popular cards plus categories with a task-led entry cue. Observe type selection, corrections, and need for specialist types. A proposal should preserve all 17 choices and avoid burying repeat-use shortcuts until evidence shows a better grouping. Status: investigate.

### T-010 · mobile secondary action discovery (F-010)

Owner: product/design; effort S–M. On 320/390 px physical phones, ask users to find Saved, Share, and Smart Parser after seeing Export first. If discovery fails, test a compact More action or another accessible surface. Verify visual/DOM order and keyboard behavior before replacing the rail. Status: investigate.

### T-011 · save failure browser retest (G-001)

Owner: QA; effort S. In a disposable local browser profile, force storage write failure, activate Save, and confirm no success toast, a recovery message, retained chart edits, and keyboard access to the alternative export. The existing automated save test is local logic evidence only. Status: planned.

### T-012 · export completion matrix (G-002)

Owner: QA; effort M. Exercise PNG 2×/4×, SVG, and clipboard on current desktop Chrome and representative mobile browsers; verify file contents, dimensions, and truthful feedback. Include blocked clipboard and generation failure. Status: planned.

### T-013 · physical touch and assistive technology (G-003)

Owner: QA/accessibility; effort M. On physical iOS and Android, operate row actions, horizontal header rail, preview jumps, chart cards, and modal with touch plus VoiceOver/TalkBack. Verify names, focus, gestures, and neighboring target separation. Status: planned.

### T-014 · text scaling and reflow (G-004)

Owner: QA/accessibility; effort S. Recheck critical flow at 200% text size and 320 CSS px equivalent at 400% browser zoom, recording any two-dimensional chart exception separately from form/navigation reflow. Status: planned.

### T-015 · complete keyboard modal/menu traversal (G-005)

Owner: QA/frontend; effort S–M. Traverse the ChartTypeBar More menu and Smart Parser/export dialogs with Tab/Shift+Tab, Enter/Space, Escape, and focus return. Create failing tests before any repair. Status: planned.

Phase exit: the register coverage rows move from partial/not-tested only after named environments are exercised and evidence is attached. An investigation may conclude that the existing dense selector or rail should remain; document that choice rather than counting it as a fix.

## Local release checklist

- Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check` on the final working tree; report warning and failure output exactly.
- Recheck root and `/pie-chart-maker` at 320/390/1440 px, light and dark canvas, parser empty and reviewed rows, save success/failure, and export error/success as access permits.
- Revalidate `audit-register.json` with the bundled validator and ensure verified IDs have actual closure evidence.
- Before deployment, separately prove deployed route/UI state and representative physical-device export behavior; this local audit authorizes neither deployment nor a release claim.
