# Development verification

Date: 2026-10-19. The records below describe observed checks; they do not establish that all release requirements are complete.

## Core plans 01–12 completion

The [completion audit](CORE-COMPLETION.md) closes every checklist item in plans 01–12 with local evidence. The final browser page reports **30/30 passed** in Chromium 143.0.7499.4 and Safari 26.3.1 on macOS; **12/12 Node tests** and the offline app/library build pass. New regressions cover exact tiny drags, no-target defaults, every toolbar command, overlap priority, all completion choices, and gesture cancellation/reversal/duplicate release. Trusted pointer checks cover both directions, full multiline preview, stable layout, short/vertical drags, injected cancellation/destruction, wheel scrolling and reduced motion. Native Enter/Escape/Tab checks supplement dispatched keyboard tests.

Plans 13–16 remain open. Results below include earlier milestones; the audit above is the current core status.

## Open export regression and documentation status

Night theme is documented in [plan 16](plans/16-NIGHT-THEME.md) and remains unimplemented. Existing browser checks cover the light appearance; they do not establish night-theme contrast, preference persistence, or state preservation during theme changes.

The guided “Open saved review” feature is now planned in [plan 15](plans/15-REOPEN-SAVED-REVIEW.md). Existing restore checks cover the model and manual restore path; they do not prove automatic saved-label configuration or the new guided reopen → edit → export workflow. Implementation and those end-to-end checks remain pending.

The user reports that split export saves only the right-side file. Earlier Safari testing recovered the left file through its individual retry link; that proved payload availability and recovery, not reliable automatic delivery of both files. The current host also uses direction-ID filenames. Required output is `<file>_<leftlabel>.json` and `<file>_<rightlabel>.json`, including empty labels. The corrected contract and focused regression plan are documented in [plan 14](plans/14-SPLIT-EXPORT-DELIVERY.md); implementation and actual-download proof are pending.

Product requirements, implementation contracts, usage/status notes, and the new fix plan are now updated for this request. Documentation is not final release sign-off: export delivery/naming results must be recorded after the fix, and native cross-platform CI remains pending. Previous test counts below must not be read as proof that the newly clarified filenames or reliable two-file delivery have passed.

## List/code selection and cross-platform follow-up

The shared block-selection boundary now includes list items and fenced code blocks. Clicking a loose-list paragraph selects its containing item; nested items and code blocks select the nearest appropriate block. Keyboard navigation uses the same blocks without duplicate stops. Exact code ranges and code whitespace are preserved. Both new regression checks were demonstrated failing before the selector fix.

The current browser page passes **22/22** checks in **Chromium 143.0.7499.4** and **Safari 26.3.1**, both on macOS. This includes list/code click handling, code keyboard selection, exact partial ranges, and simulated Win32/Linux/MacIntel modifier routing (undo, both redo variants, scoped export, and native word selection). These are real browser-engine tests with simulated platform detection, not native Windows/Linux execution. The Node suite remains **12/12 passing**, including Windows-style path separator handling in the server; its command no longer depends on Unix shell glob expansion.

Playwright now defines Chromium, Firefox, and WebKit projects. Test discovery confirms **30 cases** across the three projects. [.github/workflows/review.yml](../.github/workflows/review.yml) adds a nine-job Windows/Linux/macOS × browser matrix for the requested `recircuitcoop/review` repository. Native Firefox 146.0.1 was downloaded from the official Playwright CDN but could not be launched by the computer-use tool (two timeouts). Native Firefox and Windows/Linux results are pending.

Repository initialization failed because the sandbox blocks `.git` creation. GitHub CLI access failed, and an elevated network check was rejected because escalation is disabled. No remote repository creation, local origin configuration, push, or CI run is claimed. [Repository setup](REPOSITORY.md) contains the exact requested remote and setup commands for an unrestricted session. The earlier results below record the initial delivery and remain useful history.

## Results

| Check | Evidence |
| --- | --- |
| Clean dependency install | `npm ci --offline --full-metadata --cache /tmp/review-npm-cache --no-audit --no-fund` passed using cached registry packages. Standard `npm ci` is documented for connected environments. |
| State, validation, serialization, gestures, static serving | `npm test`: **12/12 passed**. Includes threshold boundaries, atomic restore, property-order independence, copied data, commit event consistency, both actual browser-downloaded fixtures, `.mjs` MIME types, and hidden/path traversal rejection. |
| Deliverable build | `npm run build` passed: `dist/review.html`, `dist/review-lib.js`, `dist/review.css`. The built library imports with a `mountReview` export. |
| Real browser DOM/lifecycle checks | `npm run test:page` generated `test-results/browser-check.html`; Safari **26.3.1**, macOS **26.3.1**, visibly reported **19/19 passed** after final fixes. Source: `tests/browser-check.js`. |
| Actual file input and downloads | Opened the standalone app, selected `tests/fixtures/review.md` via the system file picker, labeled two paragraphs, and used Done. Safari required download permission; the individual retry link recovered the initially blocked first download. Both `review.left.json` and `review.right.json` were read from Downloads and validated/restored together. Copies: `tests/artifacts/browser-left.json` and `browser-right.json`. |
| Actual mouse/keyboard interaction | Paragraph selection alone left annotation count unchanged. F2 + Shift+arrows selected `Emoj`; Alt+Left committed it. A separate right swipe committed a quoted paragraph once; a short gesture on a selected range did not commit. An overlapping `Keep` range opened the chooser; Down/Enter selected one saved annotation, Backspace deleted only that target, and Command+Z restored it. |

The 19 browser-page checks cover canonical strings and DOM round trips, supported Markdown/sanitization, pending/committed state and copied events, native cross-format ranges, overlapping history, grouped/split restore, reflow, effective shortcut remapping/hints/help, invalid mount options, scoped block/saved commands, toolbar focus, editable/IME guards, precise cross-block selection, pending resolution, save failure/retry, concurrent-save edits, lifecycle cleanup, and multiple instances.

Regressions were demonstrated failing before fixes for toolbar focus, metadata property-order restore, creation event state, missing server/module handling, and asynchronous save edits. Application changes remove stale download links so old export snapshots cannot appear current after annotation edits; that host behavior is also asserted in the Playwright workflow.

## Remaining verification limits

- `npm run test:browser` could not start its server: sandbox returned `listen EPERM` for `127.0.0.1:4173`. A direct headless Chromium launch was also blocked by macOS Mach-port sandbox restrictions. The Playwright suite is present but **has not passed here**. Server request handling was exercised without binding a socket; the standalone app bypasses the need for a server.
- Browser-page tests call real DOM APIs and command handlers but do not prove every physical OS shortcut, pointer cancellation, or browser default. The specific real-input checks above supplement them. Windows/Linux modifier maps, all default shortcuts across browsers, assistive-technology announcements, and broader browser coverage remain release-gate work.
- Recogito could not be downloaded/evaluated because network DNS was unavailable. The native implementation passed the recorded checks; no Recogito compatibility is claimed. Prototype defaults still need user UX feedback; touch remains outside initial scope.
- Caveman is installed/configured, but its command hook reports its compression engine unavailable and passes output through. TOKF works with `TOKF_DB_PATH=/tmp/review-tokf.db`. Serena is active/ready and MemPalace is available. Codebase Memory remains unindexed: its worker fails daemon coordination, including a retry after source was added.

Plans 01–12 are complete for core/local acceptance with the [updated evidence](CORE-COMPLETION.md). Plan 13 remains partially verified until the cross-platform and assistive-technology checks pass; the local file-to-label workflow is usable now.
